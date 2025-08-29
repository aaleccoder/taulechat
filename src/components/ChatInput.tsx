import { Send, Paperclip, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useOpenRouter } from "@/providers/openRouter";
import { useState } from "react";

export default function ChatInput({ id }: { id: string }) {
  const { sendPrompt } = useOpenRouter({ id });

  const [userInput, setUserInput] = useState("");

  const sendMessage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    sendPrompt(userInput.trim());
    setUserInput("");
  };

  return (
    <form className="flex flex-row justify-center items-center space-x-4 p-2 rounded-t-2xl w-full !bg-card">
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="!bg-background !text-foreground rounded-xl flex items-center h-12 px-3 space-x-2 w-full">
              <span>Model</span>
              <ChevronDown size={20} className="flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>GPT-3.5</DropdownMenuItem>
            <DropdownMenuItem>GPT-4</DropdownMenuItem>
            <DropdownMenuItem>Custom</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="!bg-background flex-1 h-16 px-4 py-2 rounded-xl relative flex items-center">
        <textarea
          className="resize-none w-full h-full pr-12 bg-transparent outline-none"
          placeholder="Type your message..."
          onChange={(e) => setUserInput(e.target.value)}
          value={userInput}
        />
        <button
          type="button"
          className="absolute right-6 top-1/2 -translate-y-1/2 !bg-transparent !text-foreground !shadow-none !border-none rounded-xl flex items-center justify-center h-8 w-8"
          tabIndex={-1}
        >
          <Paperclip size={20} className="flex-shrink-0" />
        </button>
      </div>

      <button
        className="!bg-primary rounded-xl flex items-center justify-center h-12 w-12"
        onClick={(e) => sendMessage(e)}
      >
        <Send size={20} className="flex-shrink-0" />
      </button>
    </form>
  );
}
