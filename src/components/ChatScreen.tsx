import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/utils/state";

export default function ChatScreen() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  useEffect(() => {
    let initialViewportHeight = window.visualViewport?.height || window.innerHeight;

    const handleViewportChange = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const heightDiff = initialViewportHeight - currentHeight;
        setKeyboardHeight(heightDiff > 150 ? heightDiff : 0);
      }
    };

    const handleResize = () => {
      setTimeout(() => {
        initialViewportHeight = window.visualViewport?.height || window.innerHeight;
        setKeyboardHeight(0);
      }, 100);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.addEventListener('orientationchange', handleResize);
    } else {
      const handleWindowResize = () => {
        const currentHeight = window.innerHeight;
        const heightDiff = initialViewportHeight - currentHeight;
        setKeyboardHeight(heightDiff > 150 ? heightDiff : 0);
      };

      window.addEventListener('resize', handleWindowResize);
      window.addEventListener('orientationchange', handleResize);

      return () => {
        window.removeEventListener('resize', handleWindowResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.removeEventListener('orientationchange', handleResize);
      }
    };
  }, []);

  return (
    <div className="md:max-w-[70vw] w-full mx-auto">
      <div
        className="flex flex-col bg-background overflow-hidden py-40"
        style={{
          height: `calc(100vh - ${keyboardHeight}px)`,
          transition: 'height 0.3s ease-out'
        }}
      >
        <ChatMessages />
      </div>
      <div
        className="absolute inset-x-0 w-full px-2 pb-[env(safe-area-inset-bottom)] mb-4 flex justify-center"
        style={{
          bottom: `${keyboardHeight}px`,
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
