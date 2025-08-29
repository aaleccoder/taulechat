import ChatInput from "./ChatInput";
import ChatMessages, { ChatMessage } from "./ChatMessages";
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { getMessagesForConversation } from "@/lib/database/methods";
import useStore from "@/utils/state";

export default function ChatScreen() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const clearAll = useStore((state) => state.clearAll);

  useEffect(() => {
    clearAll();
  }, [clearAll]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  let messagesState = useStore((state) => state.conversation?.messages);

  useEffect(() => {
    let mounted = true;
    if (!id) {
      setMessages([]);
      return;
    }

    (async () => {
      try {
        const rows = await getMessagesForConversation(id);
        if (!mounted) return;
        const mapped: ChatMessage[] = (rows || []).map((r: any) => ({
          id: r.id,
          content: r.content,
          role: r.role === "user" ? "user" : "assistant",
          timestamp: r.created_at ? Date.parse(r.created_at) : Date.now(),
        }));
        setMessages(mapped);
      } catch (err) {
        console.error("Failed to load messages for conversation", id, err);
        if (mounted) setMessages([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <div className="flex flex-col h-full bg-background justify-end">
      <ChatMessages messages={messagesState ?? messages} />
      <ChatInput id={id ?? ""} />
    </div>
  );
}
