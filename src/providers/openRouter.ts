import { ProviderName } from "@/components/Settings";
import { createConversation, createMessage } from "@/lib/database/methods";
import { ChatMessage, useLoading, useSidebarConversation, useStore } from "@/utils/state";
import { getAPIKeyFromStore } from "@/utils/store";
import OpenAI from "openai";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

function createTitleFromPrompt(prompt: string) {
  const maxLength = 50;
  if (prompt.length > maxLength) {
    return prompt.slice(0, maxLength) + "...";
  }
  return prompt;
}


export function useOpenRouter() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadKey = async () => {
      const key = await getAPIKeyFromStore(ProviderName.OpenRouter);
      setText(key || "");
    };
    loadKey();
  }, []);

  const sendPrompt = useCallback(async (id: string, prompt: string, model_id: string) => {
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      dangerouslyAllowBrowser: true,

      apiKey: await getAPIKeyFromStore(ProviderName.OpenRouter),
    });

    let isNewConversation = false;
    try {
      useLoading.getState().setLoading(true);
      let accumulated = "";

      const active = useStore.getState().getConversation();
      if (active === null || active.id !== id) {
        isNewConversation = true;
        await useStore.getState().createConversation(id, [], model_id, createTitleFromPrompt(prompt));
        useSidebarConversation.getState().addConversation({ id: id, model_id: model_id, title: createTitleFromPrompt(prompt) });
      }


      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: prompt,
        role: "user",
        conversation_id: id,
        created_at: new Date().toISOString()
      };
      useStore.getState().addMessage(userMessage);
      createMessage(userMessage.id, id, "user", userMessage.content);

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

      createMessage(assistantID, id, "assistant", accumulated)


    } catch (error) {
      console.error("Error sending prompt:", error);
      const apiError = error as any;
      if (apiError.status === 401) {
        toast.error("Please provide a valid OpenRouter API key");
      } else if (apiError.status === 429) {
        toast.error("You have hit the rate limit. Please try again later.");
      }
      if (isNewConversation && (apiError.status === 401 || apiError.status === 429)) {
        useSidebarConversation.getState().removeConversation(id);
        useStore.getState().removeConversation();
      }
    } finally {
      useLoading.getState().setLoading(false);
    }
  }, []);

  return { text, loading, sendPrompt };
}
