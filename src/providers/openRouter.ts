import { ChatMessage } from "@/components/ChatMessages";
import { ProviderName } from "@/components/Settings";
import { createConversation, createMessage } from "@/lib/database/methods";
import { useStore } from "@/utils/state";
import { getAPIKeyFromStore } from "@/utils/store";
import OpenAI from "openai";
import { useCallback, useEffect, useState } from "react";

export function useOpenRouter({ id }: { id: string }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadKey = async () => {
      const key = await getAPIKeyFromStore(ProviderName.OpenRouter);
      setText(key || "");
      console.log(key);
    };
    loadKey();
  }, []);

  const sendPrompt = useCallback(async (prompt: string) => {
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      dangerouslyAllowBrowser: true,

      apiKey: await getAPIKeyFromStore(ProviderName.OpenRouter),
    });

    try {
      setLoading(true);
      let accumulated = "";

      const active = useStore.getState().getConversation();
      if (!active || active.conversationId !== id) {
        let idCon = id || crypto.randomUUID();
        await createConversation(idCon);
        useStore.getState().createConversation(idCon);
      }


      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: prompt,
        role: "user",
        timestamp: Date.now(),
      };
      useStore.getState().addMessage(userMessage);
      createMessage(userMessage.id, "user", userMessage.content);

      const assistantID = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantID,
        content: "",
        role: "assistant",
        timestamp: Date.now(),
      };
      useStore.getState().addMessage(assistantMessage);



      const storeMessages = useStore.getState().getConversation()?.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })) || [];

      const stream = await openai.chat.completions.create({
        model: "z-ai/glm-4.5-air:free",
        messages: storeMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || "";
        accumulated += token;
        setText(accumulated);
        useStore.getState().updateMessage(assistantID, accumulated);
      }

      createMessage(assistantID, "assistant", accumulated)


    } catch (error) {
      console.error("Error sending prompt:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { text, loading, sendPrompt };
}
