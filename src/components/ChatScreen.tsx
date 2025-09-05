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
    <div className="">
      <div className="flex flex-col bg-background h-screen overflow-hidden py-40">
        <ChatMessages />
      </div>
      <div className="absolute bottom-0 w-full md:max-w-[60vw] mb-4 mx-auto px-2 flex-shrink-0">
        {/* @ts-ignore */}
        <ChatInput id={id} />
      </div>
    </div>
  );
}
