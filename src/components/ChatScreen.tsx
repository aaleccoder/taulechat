import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import { useParams } from "react-router";
import { useEffect } from "react";
import { getMessagesForConversation } from "@/lib/database/methods";
import { useStore } from "@/utils/state";

export default function ChatScreen() {
  const params = useParams<{ id: string }>();
  const id = params.id;



  let messagesState = useStore((state) => state.conversation?.messages);

  useEffect(() => {
    useStore.getState().clearAll();
    let mounted = true;
    console.log(id);
    if (!id) {
      useStore.getState().setMessages([]);
      return;
    }

    (async () => {
      try {
        const rows = await getMessagesForConversation(id);
        if (!mounted) return;
        useStore.getState().createConversation(id);
        useStore.getState().setMessages(rows);
      } catch (err) {
        console.error("Failed to load messages for conversation", id, err);
        if (mounted) useStore.getState().setMessages([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <div className="flex flex-col h-full bg-background justify-end">
      <ChatMessages messages={messagesState} />
      <ChatInput id={id ? id : ""} />
    </div>
  );
}
