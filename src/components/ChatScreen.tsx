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
    <div className="md:max-w-[70vw] w-full mx-auto relative h-screen flex flex-col">
      <div className="flex flex-col bg-background pt-20 pb-32 flex-1 overflow-hidden">
        <ChatMessages />
      </div>
      <div className="absolute inset-x-0 bottom-0 w-full px-2 pb-[env(safe-area-inset-bottom)] flex justify-center">
        <div className="w-full md:max-w-[80vw]">
          {/* @ts-ignore */}
          <ChatInput id={id} />
        </div>
      </div>
    </div>
  );
}
