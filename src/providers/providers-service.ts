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


function createTitleFromPrompt(prompt: string) {
  const maxLength = 50;
  if (prompt.length > maxLength) {
    return prompt.slice(0, maxLength) + "...";
  }
  return prompt;
}


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
  // const isOpenRouter = model?.provider === "OpenRouter";

        const active = useStore.getState().getConversation();
        if (active === null || active.id !== id) {
          isNewConversation = true;
          await initializeNewConversation(id, createTitleFromPrompt(prompt), model_id);
        }

        // Store user message and attachments
  await storeUserMessage(id, prompt, attachments);

        // Add assistant placeholder
        const assistantID = crypto.randomUUID();
        useStore.getState().addMessage({
          id: assistantID,
          content: "",
          role: "assistant",
          conversation_id: id,
          created_at: new Date().toISOString(),
        });

        // Format messages for provider
        const storeConversation = useStore.getState().getConversation();
        const storeMessages = storeConversation?.messages || [];
        const provider = await getChatProvider(model_id);
        const formattedMessages = provider.formatMessages(storeMessages, { supportsImages });

        // Prepare attachments for Gemini
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

        // Get API key
        const apiKey: string | null = (await getAPIKeyFromStore(
          isGemini ? ProviderName.Gemini : ProviderName.OpenRouter,
        )) ?? null;
        useSidebarConversation.getState().setActiveChat(id);

        // Stream response from provider
        let reader;
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
        if (!reader) throw new Error("Failed to get response reader");
        const decoder = new TextDecoder();
        let metadata: any = {};
        stream_loop: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const { token, metadata: meta } = provider.parseStreamChunk(value, decoder);
          accumulated += token;
          setText(accumulated);
          if (isGemini && meta) metadata = meta;
          streamAssistantMessageUpdate(assistantID, accumulated, isGemini ? metadata : undefined);
        }
        await finalizeAssistantMessage(assistantID, id, accumulated, isGemini ? metadata : undefined);
      } catch (error: any) {
        console.error("Error sending prompt:", error);
        if (error instanceof HttpError) {
          if (error.status === 401) {
            toast.error(`Please provide a valid API key for this provider.`);
          } else if (error.status === 429) {
            toast.error("You have hit the rate limit. Please try again later.");
          }
          if (isNewConversation && (error.status === 401 || error.status === 429)) {
            useSidebarConversation.getState().removeConversation(id);
            useStore.getState().removeConversation();
          }
        } else {
          toast.error("An unexpected error occurred. Please try again.");
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
