import ChatInput from "./ChatInput";
import ChatMessages, { ChatMessage } from "./ChatMessages";

export default function ChatScreen() {
  const chatMessages: ChatMessage[] = [
    {
      id: "1",
      content: "**Hello**, how can I assist you today?",
      sender: "assistant",
      timestamp: Date.now(),
    },
    {
      id: "2",
      content: "*I'm looking for information on your services.*",
      sender: "user",
      timestamp: Date.now(),
    },
    {
      id: "3",
      content: "That looks great! Can you explain the `greet` function?",
      sender: "assistant",
      timestamp: Date.now(),
    },
    {
      id: "4",
      content:
        "Sure! Here's what we offer:  - **Consulting**  - *Support*  - ~~Outdated Services~~  For more details, visit [our website](https://example.com).  ```javascriptfunction greet() {  console.log('Hello!');}```  > This is a blockquote with some **bold** text.",
      sender: "user",
      timestamp: Date.now(),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background justify-end">
      <ChatMessages messages={chatMessages} />
      <ChatInput />
    </div>
  );
}
