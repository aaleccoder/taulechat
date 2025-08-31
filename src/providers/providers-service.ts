import { ProviderName } from "@/components/Settings";
import { createMessage } from "@/lib/database/methods";
import {
  ChatMessage,
  useLoading,
  useSidebarConversation,
  useStore,
} from "@/utils/state";
import { getAPIKeyFromStore, getModelById } from "@/utils/store";
import { fetch } from "@tauri-apps/plugin-http";
import { useCallback, useEffect, useState } from "react";
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

export function useOpenRouter() {
  const [text, setText] = useState("");
  const [loading] = useState(false);

  useEffect(() => {
    const loadKeys = async () => {
      const openRouterKey = await getAPIKeyFromStore(ProviderName.OpenRouter);
      const geminiKey = await getAPIKeyFromStore(ProviderName.Gemini);
      setText(openRouterKey || geminiKey || "");
    };
    loadKeys();
  }, []);

  const sendPrompt = useCallback(
    async (id: string, prompt: string, model_id: string) => {
      const model = await getModelById(model_id);
      const isGemini = model?.provider === "Gemini";

      let isNewConversation = false;
      try {
        useLoading.getState().setLoading(true);
        let accumulated = "";

        const active = useStore.getState().getConversation();
        if (active === null || active.id !== id) {
          isNewConversation = true;
          await useStore
            .getState()
            .createConversation(
              id,
              [],
              model_id,
              createTitleFromPrompt(prompt),
            );
          useSidebarConversation.getState().addConversation({
            id: id,
            model_id: model_id,
            title: createTitleFromPrompt(prompt),
          });
        }

        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          content: prompt,
          role: "user",
          conversation_id: id,
          created_at: new Date().toISOString(),
        };
        useStore.getState().addMessage(userMessage);
        createMessage(userMessage.id, id, "user", userMessage.content);

        const assistantID = crypto.randomUUID();
        const assistantMessage: ChatMessage = {
          id: assistantID,
          content: "",
          role: "assistant",
          conversation_id: id,
          created_at: new Date().toISOString(),
        };
        useStore.getState().addMessage(assistantMessage);

        const storeMessages =
          useStore
            .getState()
            .getConversation()
            ?.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })) || [];

        const apiKey = await getAPIKeyFromStore(
          isGemini ? ProviderName.Gemini : ProviderName.OpenRouter,
        );
        const response = await fetch(
          isGemini
            ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
            : "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: model_id,
              messages: storeMessages,
              stream: true,
            }),
          },
        );

        if (!response.ok) {
          throw new HttpError(
            `HTTP error! status: ${response.status}`,
            response.status,
          );
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Failed to get response reader");
        }
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk
            .split("\n")
            .filter((line) => line.startsWith("data: "));

          for (const line of lines) {
            const jsonStr = line.replace("data: ", "");
            if (jsonStr === "[DONE]") {
              break;
            }
            try {
              const parsed = JSON.parse(jsonStr);
              const token = parsed.choices[0]?.delta?.content || "";
              accumulated += token;
              setText(accumulated);
              useStore.getState().updateMessage(assistantID, accumulated);
            } catch (error) {
              console.error("Failed to parse stream chunk:", error);
            }
          }
        }

        useSidebarConversation.getState().setActiveChat(id);
        createMessage(assistantID, id, "assistant", accumulated);
      } catch (error) {
        console.error("Error sending prompt:", error);
        if (error instanceof HttpError) {
          if (error.status === 401) {
            toast.error(
              `Please provide a valid ${isGemini ? "Gemini" : "OpenRouter"} API key`,
            );
          } else if (error.status === 429) {
            toast.error("You have hit the rate limit. Please try again later.");
          }

          if (
            isNewConversation &&
            (error.status === 401 || error.status === 429)
          ) {
            useSidebarConversation.getState().removeConversation(id);
            useStore.getState().removeConversation();
          }
        } else {
          toast.error("An unexpected error occurred. Please try again.");
        }
      } finally {
        useLoading.getState().setLoading(false);
      }
    },
    [],
  );

  return { text, loading, sendPrompt };
}
