import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import { useParams } from "react-router";
import { useEffect } from "react";
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
    <div className="flex flex-col bg-background pb-4 transition-all duration-300 !overflow-hidden h-[85vh]">
      <div className="w-full flex flex-col h-full transition-all duration-300 md:max-w-[60vw] mx-auto">
        <div className="flex-1 overflow-y-auto" id="chat-messages-scroll-container">
          <ChatMessages />
        </div>
        <div className="w-full md:max-w-[50vw] mx-auto transition-all duration-300 translate-y-0 opacity-100">
          {/* @ts-ignore */}
          <ChatInput id={id} />
        </div>
      </div>
    </div>
  );
}
