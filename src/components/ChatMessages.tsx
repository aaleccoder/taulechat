import { ChatMessage } from "@/utils/state";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatMessages({ messages }: { messages: ChatMessage[] | undefined }) {


  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <div className="flex-1 flex-col overflow-y-auto px-4">
      {messages.map((message) => {
        if (message.role === "user") {
          return (
            <div
              key={message.id}
              className={`message ${message.role} flex justify-end items-end ml-auto px-4 py-2 bg-card w-fit max-w-[50%] rounded-2xl`}
            >
              <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
            </div>
          );
        } else {
          return (
            <div
              key={message.id}
              className={`message ${message.role} w-full`}
            >
              <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
            </div>
          );
        }
      })}
    </div>
  );
}
