import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { getConversation, getMessagesForConversation } from "@/lib/database/methods";
import { useStore } from "@/utils/state";

export default function ChatScreen() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  useEffect(() => {
    let mounted = true;

    const loadConversation = async () => {
      if (!id) {
        if (mounted) {
          useStore.getState().clearAll();
        }
        return;
      }

      try {
        if (mounted) {
          await useStore.getState().setConversation(id);
          console.log("Loaded conversation:", id);
        }
      } catch (err) {
        console.error("Failed to load conversation", id, err);
      }
    };

    loadConversation();

    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <div className="flex flex-col h-[90vh] overflow-y-auto bg-background">
      <div className="flex-1 overflow-y-auto">
        <ChatMessages chatid={id ? id : ""} />
      </div>
      <ChatInput id={id ? id : ""} />
    </div>
  );
}
