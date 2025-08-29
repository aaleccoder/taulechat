import { Send, Paperclip, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useOpenRouter } from "@/providers/openRouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { styles } from "@/constants/style";
import { getModelsFromStore } from "@/utils/store";

export default function ChatInput({ id }: { id: string }) {
  const { sendPrompt } = useOpenRouter({ id });

  const [userInput, setUserInput] = useState("");
  const [models, setModels] = useState<string[]>([]);


  useEffect(() => {
    const loadModels = async () => {
      try {
        const fetchedModels = await getModelsFromStore();
        console.log(fetchedModels);
        setModels(fetchedModels ?? []);
      } catch (error) {
        console.error("Error fetching models:", error);

      }
    };
    loadModels();
  }, [])






  const sendMessage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    sendPrompt(userInput.trim());
    setUserInput("");
  };

  return (
    <form className="flex flex-row justify-center items-center space-x-4 p-2 rounded-t-2xl w-full bg-card">
      <div className="bg-background flex-1 px-4 py-2 rounded-xl relative flex-col items-center space-y-4">
        <textarea
          ref={(el) => {
            if (el) {
              el.style.height = 'auto';
              el.style.height = el.scrollHeight + 'px';
            }
          }}
          className="resize-none w-full max-h-48 pr-12 bg-transparent outline-none transition-all duration-200 ease-in-out"
          placeholder="Type your message..."
          onChange={(e) => {
            setUserInput(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          value={userInput}
        />
        <div className="flex flex-row items-center space-x-2">
          <Button
            className="flex items-center justify-center h-8 w-8"
            tabIndex={-1}
          >
            <Paperclip size={styles.iconSize} className="flex-shrink-0" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={"outline"} className="">
                <span>Model</span>
                <ChevronDown size={styles.iconSize} className="flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              {models.map((model) => (
                <DropdownMenuItem key={model.id} >{model.name}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Button
        className="flex items-center justify-center h-12 w-12"
        onClick={(e) => sendMessage(e)}
      >
        <Send size={styles.iconSize} className="flex-shrink-0" />
      </Button>
    </form >
  );
}
