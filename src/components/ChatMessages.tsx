import { useStore } from "@/utils/state";
import { shallow } from "zustand/shallow";
import Markdown from "react-markdown";
import { useParams } from "react-router";
import remarkGfm from "remark-gfm";
export type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: number;
}

export default function ChatMessages({ id }: { id: string }) {


  const messages = useStore<ChatMessage[]>((state) => {
    if (!id) return [];
    const conversation = state.conversations.find((c) => c.conversationId === id);
    return conversation?.messages || [];
  });

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
