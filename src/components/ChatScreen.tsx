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
    <div className="md:max-w-[70vw] w-full mx-auto">
      <div
        className="flex flex-col bg-background overflow-hidden py-40"

      >
        <ChatMessages />
      </div>
      <div
        className="absolute inset-x-0 w-full px-2 pb-[env(safe-area-inset-bottom)] mb-4 flex justify-center"
        style={{
          transition: 'bottom 0.3s ease-out'
        }}
      >
        <div className="w-full md:max-w-[80vw] flex-shrink-0">
          {/* @ts-ignore */}
          <ChatInput id={id} />
        </div>
      </div>
    </div>
  );
}
