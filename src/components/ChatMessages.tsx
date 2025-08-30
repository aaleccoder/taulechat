import { ChatMessage, useLoading, useStore } from "@/utils/state";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatMessages({ chatid }: { chatid: string }) {
  const messages = useStore((state) => state.conversation?.messages);
  const loading = useLoading((state) => state.loading);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 py-4">
      {messages.map((message, index) => {
        if (message.role === "user") {
          return (
            <div
              key={message.id || `user-${index}`}
              className="flex justify-end items-end"
            >
              <div
                className={`message ${message.role} ml-auto px-4 py-2 bg-card w-fit max-w-[50%] rounded-2xl`}
              >
                <Markdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </Markdown>
              </div>
            </div>
          );
        } else {
          return (
            <div
              key={message.id || `ai-${index}`}
              className={`message ${message.role} w-full`}
            >
              {loading && index === messages.length - 1 ? (
                <div className="flex items-center space-x-1 py-2">
                  <span className="dot bg-muted rounded-full w-2 h-2 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="dot bg-muted rounded-full w-2 h-2 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="dot bg-muted rounded-full w-2 h-2 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              ) : (
                <Markdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </Markdown>
              )}
            </div>
          );
        }
      })}
    </div>
  );
}
