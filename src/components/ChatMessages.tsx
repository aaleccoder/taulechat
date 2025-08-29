import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
export type ChatMessage = {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: number;
};

export default function ChatMessages({
  messages,
}: {
  messages: ChatMessage[];
}) {
  return (
    <div className="flex-1 flex-col overflow-y-auto px-4">
      {messages.map((message) => {
        if (message.sender === "user") {
          return (
            <div
              key={message.id}
              className={`message ${message.sender} flex justify-end items-end ml-auto px-4 py-2 bg-card w-fit max-w-[50%] rounded-2xl`}
            >
              <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
            </div>
          );
        } else {
          return (
            <div
              key={message.id}
              className={`message ${message.sender} w-full`}
            >
              <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
            </div>
          );
        }
      })}
    </div>
  );
}
