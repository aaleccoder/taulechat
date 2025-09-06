import { useLoading, useStore, useUIVisibility } from "@/utils/state";
import { toast } from "sonner";
import { useCallback } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import UserMessage from "./messages/UserMessage";
import AssistantMessage from "./messages/AssistantMessage";
import Lightbox from "./Lightbox";


export default function ChatMessages() {
  const messages = useStore((state) => state.conversation?.messages);
  const loading = useLoading((state) => state.loading);
  const { isChatExpanded } = useUIVisibility();

  const handleCopyToClipboard = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  }, []);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-muted-foreground h-full">
        <p className="text-sm">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col space-y-4 w-full max-w-full transition-all duration-300 px-4 py-4 overflow-y-auto h-full">
        {messages.map((message, index) => {

          if (message.role === "user") {
            return (
              <UserMessage
                key={message.id}
                message={message}
                isChatExpanded={isChatExpanded}
                handleCopyToClipboard={handleCopyToClipboard}
              />
            );
          } else {
            return (
              <AssistantMessage
                key={message.id}
                message={message}
                isChatExpanded={isChatExpanded}
                handleCopyToClipboard={handleCopyToClipboard}
                loading={loading && index === messages.length - 1}
              />
            );
          }
        })}
        <Lightbox />
      </div>
    </TooltipProvider>
  );
}
