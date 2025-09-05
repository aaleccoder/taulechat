import { ProviderName } from "@/components/Settings";
import { createMessage, createMessageFile } from "@/lib/database/methods";
import { ChatMessage, MessageFile, useLoading, useSidebarConversation, useStore } from "@/utils/state";
import { getAPIKeyFromStore, getModelById } from "@/utils/store";
import { fetch } from "@tauri-apps/plugin-http";
import { useCallback, useState } from "react";
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
      if (loading) return; // Prevent re-entry
      setLoading(true);
      const model = await getModelById(model_id);
      const isGemini = model?.provider === "Gemini";
      const isOpenRouter = model?.provider === "OpenRouter";
      const supportsImages = !!model?.architecture?.input_modalities?.includes("image");

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
          files: attachments.slice(0, 2).map((a) => ({
            id: a.id,
            message_id: "", // will be set when loaded from DB
            file_name: a.fileName,
            mime_type: a.mimeType,
            data: a.bytes,
            size: a.size,
            created_at: new Date().toISOString(),
          })) as MessageFile[],
        };
        useStore.getState().addMessage(userMessage);
        await createMessage(userMessage.id, id, "user", userMessage.content);

        if (attachments.length > 0) {
          if (!isOpenRouter && !isGemini) {
            toast.error("Attachments are only supported for OpenRouter and Gemini models.");
          } else {
            for (const a of attachments.slice(0, 2)) {
              try {
                await createMessageFile(a.id, userMessage.id, a.fileName, a.mimeType, a.bytes, a.size);
              } catch (e) {
                console.error("Failed to save attachment:", e);
              }
            }
          }
        }

        const assistantID = crypto.randomUUID();
        const assistantMessage: ChatMessage = {
          id: assistantID,
          content: "",
          role: "assistant",
          conversation_id: id,
          created_at: new Date().toISOString(),
        };
        useStore.getState().addMessage(assistantMessage);

        const storeConversation = useStore.getState().getConversation();
        const storeMessages = storeConversation?.messages || [];
        const formattedMessages = storeMessages.map((m) => {
          if (isOpenRouter && m.role === "user" && (m.files?.length || 0) > 0) {
            const parts: any[] = [];
            if (m.content?.trim()) parts.push({ type: "text", text: m.content });
            if (supportsImages) {
              for (const f of m.files!.slice(0, 2)) {
                if (f.mime_type.startsWith("image/")) {
                  const b64 = uint8ToBase64(f.data);
                  parts.push({ type: "image_url", image_url: { url: `data:${f.mime_type};base64,${b64}` } });
                }
              }
            }
            return { role: m.role, content: parts.length > 0 ? parts : m.content };
          }
          return { role: m.role, content: m.content };
        });

        const apiKey = await getAPIKeyFromStore(
          isGemini ? ProviderName.Gemini : ProviderName.OpenRouter,
        );
        useSidebarConversation.getState().setActiveChat(id);
        if (isGemini) {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (apiKey) {
            headers["x-goog-api-key"] = apiKey;
          }
          
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model_id.split("/")[1]}:streamGenerateContent?alt=sse`;
          
          const parts: any[] = [{ text: prompt }];

          if (attachments.length > 0) {
            for (const attachment of attachments) {
              if (attachment.mimeType === "application/pdf") {
                const base64 = uint8ToBase64(attachment.bytes);
                parts.push({
                  inline_data: {
                    mime_type: "application/pdf",
                    data: base64,
                  },
                });
              } else if (attachment.mimeType.startsWith("image/")) {
                const base64 = uint8ToBase64(attachment.bytes);
                parts.push({
                  inline_data: {
                    mime_type: attachment.mimeType,
                    data: base64,
                  },
                });
              }
            }
          }

          const body = JSON.stringify({
            contents: [
              {
                parts: parts,
              },
            ],
            tools: [
              {
                "google_search": {}
              }
            ]
          });
          const response = await fetch(url, {
            method: "POST",
            headers,
            body,
          });
          if (!response.ok) {
            if (response.status === 404) {
              toast.error("The selected Gemini model does not exist.");
              setLoading(false);
              useLoading.getState().setLoading(false);
              return;
            }
            throw new HttpError(`Gemini API error! status: ${response.status}`, response.status);
          }
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("Failed to get Gemini response reader");
          }
          const decoder = new TextDecoder();
          gemini_stream_loop: while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));
            for (const line of lines) {
              const jsonStr = line.replace("data: ", "").trim();
              if (jsonStr === "[DONE]") break gemini_stream_loop;
              try {
                const parsed = JSON.parse(jsonStr);
                const token = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                accumulated += token;
                setText(accumulated);
                // Save Gemini fields for final DB update
                assistantMessage.groundingChunks = parsed?.candidates?.[0]?.groundingMetadata?.groundingChunks;
                assistantMessage.groundingSupports = parsed?.candidates?.[0]?.groundingMetadata?.groundingSupports;
                assistantMessage.webSearchQueries = parsed?.webSearchQueries;
                assistantMessage.usageMetadata = parsed?.usageMetadata;
                assistantMessage.modelVersion = parsed?.modelVersion;
                assistantMessage.responseId = parsed?.responseId;
                useStore.getState().updateMessage(assistantID, {
                  content: accumulated,
                  groundingChunks: assistantMessage.groundingChunks,
                  groundingSupports: assistantMessage.groundingSupports,
                  webSearchQueries: assistantMessage.webSearchQueries,
                  usageMetadata: assistantMessage.usageMetadata,
                  modelVersion: assistantMessage.modelVersion,
                  responseId: assistantMessage.responseId,
                });
              } catch (error) {
                console.error("Failed to parse Gemini stream chunk:", error);
              }
            }
          }
          await createMessage(
            assistantID,
            id,
            "assistant",
            accumulated,
            undefined,
            JSON.stringify(assistantMessage.groundingChunks ?? null),
            JSON.stringify(assistantMessage.groundingSupports ?? null),
            JSON.stringify(assistantMessage.webSearchQueries ?? null),
            JSON.stringify(assistantMessage.usageMetadata ?? null),
            assistantMessage.modelVersion ?? null,
            assistantMessage.responseId ?? null
          );
        } else {
          const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey || ""}`,
            },
            body: JSON.stringify({
              model: model_id,
              messages: formattedMessages,
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
        }

        if (!isGemini) {
          await createMessage(assistantID, id, "assistant", accumulated);
        }
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
          useLoading.getState().setLoading(false);
        } else {
          useLoading.getState().setLoading(false);
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
