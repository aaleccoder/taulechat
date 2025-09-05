import { ProviderName } from "@/components/Settings";
import { useLoading, useSidebarConversation, useStore } from "@/utils/state";
import { getAPIKeyFromStore, getModelById } from "@/utils/store";
import { useCallback, useState } from "react";
import { getChatProvider } from "./provider-factory";
import {
  initializeNewConversation,
  storeUserMessage,
  streamAssistantMessageUpdate,
  finalizeAssistantMessage,
} from "@/services/conversation-manager";
import { toast } from "sonner";

// Custom error classes for improved error handling
export class ChatServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatServiceError";
  }
}

export class APIKeyError extends ChatServiceError {
  constructor() {
    super("Invalid or missing API key for this provider.");
    this.name = "APIKeyError";
  }
}

export class RateLimitError extends ChatServiceError {
  constructor() {
    super("You have exceeded the rate limit. Please try again later.");
    this.name = "RateLimitError";
  }
}

export class PaymentRequiredError extends ChatServiceError {
  constructor(message?: string) {
    super(message || "A payment is required to use this model.");
    this.name = "PaymentRequiredError";
  }
}

export class ProviderResponseError extends ChatServiceError {
  constructor(message: string) {
    super(message);
    this.name = "ProviderResponseError";
  }
}

export class NetworkError extends ChatServiceError {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof APIKeyError) {
    return error.message;
  }
  if (error instanceof RateLimitError) {
    return error.message;
  }
  if (error instanceof PaymentRequiredError) {
    return error.message;
  }
  if (error instanceof ProviderResponseError) {
    return `An API error occurred: ${error.message}`;
  }
  if (error instanceof NetworkError) {
    return `Network error: ${error.message}`;
  }
  // Fallback for unexpected errors
  return "An unexpected error occurred. Please check the console for details.";
}


function createTitleFromPrompt(prompt: string) {
  const maxLength = 50;
  if (prompt.length > maxLength) {
    return prompt.slice(0, maxLength) + "...";
  }
  return prompt;
}


// Legacy HttpError for backward compatibility (can be removed once providers are refactored)
class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}



export function useChatService() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  type SelectedAttachment = {
    id: string;
    fileName: string;
    mimeType: string;
    base64: string;
    bytes: Uint8Array;
    size: number;
  };

  function uint8ToBase64(u8: Uint8Array) {
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < u8.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + chunk)) as any);
    }
    return btoa(binary);
  }

  const sendPrompt = useCallback(
    async (id: string, prompt: string, model_id: string, attachments: SelectedAttachment[] = []) => {
      if (loading) return;
      setLoading(true);
      let isNewConversation = false;
      try {
        useLoading.getState().setLoading(true);
        let accumulated = "";
        const model = await getModelById(model_id);
        const supportsImages = !!model?.architecture?.input_modalities?.includes("image");
        const isGemini = model?.provider === "Gemini";
        // ...existing code...
        const active = useStore.getState().getConversation();
        if (active === null || active.id !== id) {
          isNewConversation = true;
          await initializeNewConversation(id, createTitleFromPrompt(prompt), model_id);
        }
        // ...existing code...
        await storeUserMessage(id, prompt, attachments);
        // ...existing code...
        const assistantID = crypto.randomUUID();
        useStore.getState().addMessage({
          id: assistantID,
          content: "",
          role: "assistant",
          conversation_id: id,
          created_at: new Date().toISOString(),
          files: [],
        });
        // ...existing code...
        const storeConversation = useStore.getState().getConversation();
        const storeMessages = storeConversation?.messages || [];
        const provider = await getChatProvider(model_id);
        const formattedMessages = provider.formatMessages(storeMessages, { supportsImages });
        // ...existing code...
        let geminiParts: any[] = [{ text: prompt }];
        if (isGemini && attachments.length > 0) {
          for (const attachment of attachments) {
            const base64 = uint8ToBase64(attachment.bytes);
            geminiParts.push({
              inline_data: {
                mime_type: attachment.mimeType,
                data: base64,
              },
            });
          }
        }
        // ...existing code...
        const apiKey: string | null = (await getAPIKeyFromStore(
          isGemini ? ProviderName.Gemini : ProviderName.OpenRouter,
        )) ?? null;
        useSidebarConversation.getState().setActiveChat(id);
        // ...existing code...
        let reader;
        let generatedFiles: any[] = [];
        if (isGemini) {
          reader = await provider.streamResponse({
            modelId: model_id,
            messages: formattedMessages,
            apiKey,
            attachments: geminiParts,
          });
        } else {
          reader = await provider.streamResponse({
            modelId: model_id,
            messages: formattedMessages,
            apiKey,
          });
        }
        if (!reader) throw new ProviderResponseError("Failed to get response reader");
        const decoder = new TextDecoder();
        let metadata: any = {};
        stream_loop: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const { token, metadata: meta } = provider.parseStreamChunk(value, decoder);
          // ...existing code...
          if (meta && meta.images && Array.isArray(meta.images)) {
            generatedFiles = meta.images.map((img: any, idx: number) => ({
              id: crypto.randomUUID(),
              message_id: assistantID,
              file_name: `generated-image-${idx + 1}.${(img.mimeType || "image/png").split("/")[1]}`,
              mime_type: img.mimeType || "image/png",
              data: img.data,
              size: Math.floor((img.data.length * 3) / 4),
              created_at: new Date().toISOString(),
            }));
            setText("");
            streamAssistantMessageUpdate(assistantID, "", { files: generatedFiles });
          } else {
            accumulated += token;
            setText(accumulated);
            if (isGemini && meta) metadata = meta;
            streamAssistantMessageUpdate(assistantID, accumulated, isGemini ? metadata : undefined);
          }
        }
        await finalizeAssistantMessage(assistantID, id, accumulated, isGemini ? { ...metadata, files: generatedFiles } : undefined);
      } catch (error: any) {
        console.error("Error sending prompt:", error);
        const errorMessage = getErrorMessage(error);
        toast.error(errorMessage);
        // Remove conversation only for non-rate-limit errors
        if (!(error instanceof RateLimitError)) {
          if (isNewConversation) {
            useSidebarConversation.getState().removeConversation(id);
            useStore.getState().removeConversation();
          }
        }
      } finally {
        useLoading.getState().setLoading(false);
        setLoading(false);
      }
    },
    [loading],
  );

  return { text, loading, sendPrompt };
}

// Backward compatibility
export const useOpenRouter = useChatService;
