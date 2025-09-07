import { create } from "zustand";
import { ChatMessage } from "@/utils/state";
import { getChatProvider } from "@/providers/provider-factory";
import { getAPIKeyFromStore, getModelById } from "@/utils/store";
import { ProviderName } from "@/components/Settings";
import { uint8ToBase64 } from "@/lib/utils";
import {
  initializeNewConversation,
  storeUserMessage,
  finalizeAssistantMessage,
} from "@/services/conversation-manager";
import { useStore, useSidebarConversation } from "@/utils/state";
import { getErrorMessage, ProviderResponseError } from "@/providers/types";
import { toast } from "sonner";
import { ModelParameters } from "@/providers/types";

type SelectedAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  base64: string;
  bytes: Uint8Array;
  size: number;
};

interface StreamingState {
  // Map of streamId -> in-progress ChatMessage
  streams: Record<string, ChatMessage>;
  // Map of streamId -> AbortController for cancellation
  controllers: Record<string, AbortController>;
}

interface StreamingActions {
  // Public actions
  startStream: (
    conversationId: string,
    prompt: string,
    modelId: string,
    attachments?: SelectedAttachment[],
    parameters?: ModelParameters,
  ) => Promise<void>;
  cancelStream: (streamId: string) => void;

  // Internal actions
  _addStream: (streamId: string, message: ChatMessage, controller: AbortController) => void;
  _updateStream: (streamId: string, content: string, metadata?: any, thoughts?: string) => void;
  _removeStream: (streamId: string) => void;
}

type StreamingStore = StreamingState & StreamingActions;

function createTitleFromPrompt(prompt: string): string {
  const maxLength = 50;
  if (prompt.length > maxLength) {
    return prompt.slice(0, maxLength) + "...";
  }
  return prompt;
}

export const useStreamingStore = create<StreamingStore>((set, get) => ({
  streams: {},
  controllers: {},

  // Public Actions
  startStream: async (
    conversationId: string,
    prompt: string,
    modelId: string,
    attachments: SelectedAttachment[] = [],
    parameters?: ModelParameters,
  ) => {
    const streamId = crypto.randomUUID(); // This will be our assistant message ID
    const abortController = new AbortController();
    let isNewConversation = false;

    // Create initial placeholder message
    const initialMessage: ChatMessage = {
      id: streamId,
      content: "",
      role: "assistant",
      conversation_id: conversationId,
      created_at: new Date().toISOString(),
      files: [],
      streaming: true,
    };

    // Add stream to store immediately for UI reactivity
    get()._addStream(streamId, initialMessage, abortController);

    try {
      // Get model information
      const model = await getModelById(modelId);
      const supportsImages = !!model?.architecture?.input_modalities?.includes("image");
      const isGemini = model?.provider === "Gemini";

      // Check if we need to create a new conversation
      const active = useStore.getState().getConversation();
      if (active === null || active.id !== conversationId) {
        isNewConversation = true;
        await initializeNewConversation(conversationId, createTitleFromPrompt(prompt), modelId);
      }

      // Store the user message
      await storeUserMessage(conversationId, prompt, attachments);

      // Add the placeholder assistant message to the main store for immediate UI feedback
      useStore.getState().addMessage(initialMessage);

      // Get conversation messages for context
      const storeConversation = useStore.getState().getConversation();
      const storeMessages = storeConversation?.messages || [];

      // Get provider and format messages
      const provider = await getChatProvider(modelId);
      const formattedMessages = provider.formatMessages(storeMessages, { supportsImages });

      // Handle Gemini attachments
      let geminiParts: any[] = [{ text: prompt }];
      if (isGemini && attachments.length > 0) {
        let totalPdfCount = 0;
        for (const attachment of attachments) {
          const base64 = uint8ToBase64(attachment.bytes);

          // Count PDFs and warn about page limits
          if (attachment.mimeType === "application/pdf") {
            totalPdfCount++;
            if (totalPdfCount === 1) {
              toast.info("Note: Gemini models support up to 1000 document pages total. Additional pages will be ignored.", {
                duration: 5000
              });
            }
          }

          geminiParts.push({
            inline_data: {
              mime_type: attachment.mimeType,
              data: base64,
            },
          });
        }
      }

      // Get API key
      const apiKey: string | null = (await getAPIKeyFromStore(
        isGemini ? ProviderName.Gemini : ProviderName.OpenRouter,
      )) ?? null;

      // Set active chat
      useSidebarConversation.getState().setActiveChat(conversationId);

      // Start streaming
      let reader: ReadableStreamDefaultReader<Uint8Array>;
      let generatedFiles: any[] = [];
      let accumulated = "";
      let accumulatedThoughts = "";

      if (isGemini) {
        reader = await provider.streamResponse({
          modelId,
          messages: formattedMessages,
          apiKey,
          attachments: geminiParts,
          parameters,
          modelInfo: model,
          signal: abortController.signal,
        });
      } else {
        reader = await provider.streamResponse({
          modelId,
          messages: formattedMessages,
          apiKey,
          parameters,
          modelInfo: model,
          signal: abortController.signal,
        });
      }

      if (!reader) throw new ProviderResponseError("Failed to get response reader");

      const decoder = new TextDecoder();
      let metadata: any = {};

      // Stream processing loop
      stream_loop: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const { token, metadata: meta, thoughts } = provider.parseStreamChunk(value, decoder);

        // Handle thoughts accumulation
        if (thoughts) {
          accumulatedThoughts += thoughts;
        }

        // Handle image generation
        if (meta && meta.images && Array.isArray(meta.images)) {
          generatedFiles = meta.images.map((img: any, idx: number) => ({
            id: crypto.randomUUID(),
            message_id: streamId,
            file_name: `generated-image-${idx + 1}.${(img.mimeType || "image/png").split("/")[1]}`,
            mime_type: img.mimeType || "image/png",
            data: img.data,
            size: Math.floor((img.data.length * 3) / 4),
            created_at: new Date().toISOString(),
          }));

          get()._updateStream(streamId, "", { files: generatedFiles }, accumulatedThoughts);
        } else {
          accumulated += token;

          // Update metadata for both providers
          if (meta) metadata = { ...metadata, ...meta };

          get()._updateStream(streamId, accumulated, metadata, accumulatedThoughts);
        }
      }

    } catch (error: any) {
      console.error("Error in stream:", error);

      // If this was an abort, don't show error toast
      if (error.name === 'AbortError') {
        return;
      }

      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);

      // Remove conversation only for non-rate-limit errors and not abort errors
      if (error.name !== 'RateLimitError' && error.name !== 'AbortError') {
        if (isNewConversation) {
          useSidebarConversation.getState().removeConversation(conversationId);
          useStore.getState().removeConversation();
        }
      }
    } finally {
      // Cleanup and finalization
      const currentStream = get().streams[streamId];
      if (currentStream) {
        try {
          // Finalize the message in the database
          await finalizeAssistantMessage(
            streamId,
            conversationId,
            currentStream.content,
            {
              files: currentStream.files || [],
              usageMetadata: (currentStream as any).usageMetadata,
              groundingChunks: (currentStream as any).groundingChunks,
              groundingSupports: (currentStream as any).groundingSupports,
              webSearchQueries: (currentStream as any).webSearchQueries,
              modelVersion: (currentStream as any).modelVersion,
              responseId: (currentStream as any).responseId,
              annotations: (currentStream as any).annotations,
            },
            currentStream.thoughts || "",
          );

          // Update the main store to reflect the persisted message
          useStore.getState().updateMessage(streamId, {
            ...currentStream,
            streaming: false,
          });

          // Refresh the conversation if user is viewing it
          const currentConversation = useStore.getState().getConversation();
          if (currentConversation?.id === conversationId) {
            await useStore.getState().setConversation(conversationId);
          }
        } catch (finalizeError) {
          console.error("Error finalizing message:", finalizeError);
        }
      }

      // Always remove from streaming store
      get()._removeStream(streamId);
    }
  },

  cancelStream: (streamId: string) => {
    const { controllers } = get();
    const controller = controllers[streamId];

    if (controller) {
      controller.abort();
      // The cleanup will happen in the finally block of startStream
    }
  },

  // Internal Actions
  _addStream: (streamId: string, message: ChatMessage, controller: AbortController) => {
    set((state) => ({
      streams: { ...state.streams, [streamId]: message },
      controllers: { ...state.controllers, [streamId]: controller },
    }));
  },

  _updateStream: (streamId: string, content: string, metadata?: any, thoughts?: string) => {
    set((state) => {
      const existingMessage = state.streams[streamId];
      if (!existingMessage) return state;

      const updatedMessage: ChatMessage = {
        ...existingMessage,
        content,
        thoughts,
        ...(metadata?.files && { files: metadata.files }),
        ...(metadata?.usageMetadata && { usageMetadata: metadata.usageMetadata }),
        ...(metadata?.groundingChunks && { groundingChunks: metadata.groundingChunks }),
        ...(metadata?.groundingSupports && { groundingSupports: metadata.groundingSupports }),
        ...(metadata?.webSearchQueries && { webSearchQueries: metadata.webSearchQueries }),
        ...(metadata?.modelVersion && { modelVersion: metadata.modelVersion }),
        ...(metadata?.responseId && { responseId: metadata.responseId }),
        ...(metadata?.annotations && { annotations: metadata.annotations }),
      };

      // Also update the main store for immediate UI feedback
      useStore.getState().updateMessage(streamId, updatedMessage);

      return {
        ...state,
        streams: { ...state.streams, [streamId]: updatedMessage },
      };
    });
  },

  _removeStream: (streamId: string) => {
    set((state) => {
      const { [streamId]: removedStream, ...remainingStreams } = state.streams;
      const { [streamId]: removedController, ...remainingControllers } = state.controllers;

      return {
        streams: remainingStreams,
        controllers: remainingControllers,
      };
    });
  },
}));
