import { useStore, useUIVisibility, ChatMessage } from "@/utils/state";
import { useStreamingStore } from "@/stores/streaming-store";
import { toast } from "sonner";
import { useCallback, useMemo } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import UserMessage from "./messages/UserMessage";
import AssistantMessage from "./messages/AssistantMessage";
import Lightbox from "./Lightbox";

export default function ChatMessages() {
  const conversation = useStore((state) => state.conversation);
  const savedMessages = conversation?.messages || [];
  const conversationId = conversation?.id;
  const streams = useStreamingStore((state) => state.streams);

  const { isChatExpanded } = useUIVisibility();

  // Combine saved messages with active streams for this conversation
  const messages = useMemo(() => {
    if (!conversationId) return savedMessages;

    // Get any streaming messages for this conversation
    const streamingMessages = Object.values(streams).filter(
      (streamMessage: ChatMessage) =>
        streamMessage.conversation_id === conversationId,
    );

    // Return combined list: saved messages + streaming messages
    return [...savedMessages, ...streamingMessages];
  }, [savedMessages, streams, conversationId]);

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
        {messages.map((message) => {
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
                loading={message.streaming === true}
              />
            );
          }
        })}
        <Lightbox />
      </div>
    </TooltipProvider>
  );
}
