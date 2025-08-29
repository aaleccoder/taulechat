import { useStore } from "@/utils/state";
import ChatInput from "./ChatInput";
import ChatMessages, { ChatMessage } from "./ChatMessages";
import { useParams } from "react-router";

export default function ChatScreen() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  return (
    <div className="flex flex-col h-full bg-background justify-end">
      <ChatMessages id={id ? id : ""} />
      <ChatInput id={id ? id : ""} />
    </div>
  );
}
