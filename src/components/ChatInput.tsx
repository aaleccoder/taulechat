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
import { Model, useStore } from "@/utils/state";
import { getModelsFromStore } from "@/utils/store";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerTrigger } from "./ui/drawer";
import React from "react";

export default function ChatInput({ id }: { id: string }) {

  const [userInput, setUserInput] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [open, setOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<Model | null>(
    null
  )
  const { sendPrompt } = useOpenRouter({ id });




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
    sendPrompt(userInput.trim(), selectedModel?.id ?? "");
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
          {!useIsMobile() ? (
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="flex items-center justify-center h-8 px-3 rounded-full" variant="outline" >
                    {selectedModel ? <>{selectedModel.name}</> : <>Set model</>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <ModelsList models={models} setSelectedModel={setSelectedModel} />
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <Drawer open={open} onOpenChange={setOpen}>
              <DrawerTrigger asChild>
                <Button variant={"outline"} className="flex items-center justify-center h-8 px-3 rounded-full">
                  {selectedModel ? <>{selectedModel.name}</> : <>+ Set model</>}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="w-[200px] p-0">
                <ModelsList models={models} setSelectedModel={setSelectedModel} />
              </DrawerContent>
            </Drawer>
          )}
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


function ModelsList({ models, setSelectedModel }: { models: Model[], setSelectedModel: (model: Model) => void }) {
  return (
    <Command>
      <CommandInput placeholder="Search model..." />
      <CommandList>
        <CommandEmpty>No model found.</CommandEmpty>
        <CommandGroup>
          {models.map((model) => (
            <CommandItem key={model.id} onSelect={() => {
              setSelectedModel(model);
            }}>
              {model.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
