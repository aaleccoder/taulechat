import { ProviderName } from "@/components/Settings";
import { createConversation, createMessage } from "@/lib/database/methods";
import { ChatMessage, useSidebarConversation, useStore } from "@/utils/state";
import { getAPIKeyFromStore } from "@/utils/store";
import OpenAI from "openai";
import { useCallback, useEffect, useState } from "react";

function createTitleFromPrompt(prompt: string) {
  const maxLength = 50;
  if (prompt.length > maxLength) {
    return prompt.slice(0, maxLength) + "...";
  }
  return prompt;
}


export function useOpenRouter({ id }: { id: string }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadKey = async () => {
      const key = await getAPIKeyFromStore(ProviderName.OpenRouter);
      setText(key || "");
    };
    loadKey();
  }, []);

  const sendPrompt = useCallback(async (prompt: string, model_id: string) => {
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      dangerouslyAllowBrowser: true,

      apiKey: await getAPIKeyFromStore(ProviderName.OpenRouter),
    });

    try {
      setLoading(true);
      let accumulated = "";

      const active = useStore.getState().getConversation();
      console.log(active?.id);
      console.log(id);
      if (!active || active.id !== id) {
        let idCon = id || crypto.randomUUID();
        await createConversation(idCon);
        useStore.getState().createConversation(idCon);
        useSidebarConversation.getState().addConversation({ id: idCon, model_id: model_id, title: createTitleFromPrompt(prompt) });
      }


      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: prompt,
        role: "user",
        conversation_id: id,
        created_at: new Date().toISOString()
      };
      useStore.getState().addMessage(userMessage);
      createMessage(crypto.randomUUID(), useStore.getState().getConversation()?.id ?? "", "user", userMessage.content);

      const assistantID = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantID,
        content: "",
        role: "assistant",
        conversation_id: id,
        created_at: new Date().toISOString()
      };
      useStore.getState().addMessage(assistantMessage);



      const storeMessages = useStore.getState().getConversation()?.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })) || [];

      const stream = await openai.chat.completions.create({
        model: model_id,
        messages: storeMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || "";
        accumulated += token;
        setText(accumulated);
        useStore.getState().updateMessage(assistantID, accumulated);
      }

      createMessage(crypto.randomUUID(), useStore.getState().getConversation()?.id ?? "", "assistant", accumulated)


    } catch (error) {
      console.error("Error sending prompt:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { text, loading, sendPrompt };
}
