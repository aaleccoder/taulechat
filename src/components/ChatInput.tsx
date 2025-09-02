import { Send, Paperclip, Star } from "lucide-react";
import { useOpenRouter } from "@/providers/providers-service";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { styles } from "@/constants/style";
import { OpenRouterModel, useStore } from "@/utils/state";
import {
  getDefaultModel,
  getModelsFromStore,
  saveDefaultModel,
} from "@/utils/store";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerTrigger } from "./ui/drawer";
import React from "react";
import { toast } from "sonner";
import { open as openFile } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

export default function ChatInput({ id }: { id: string }) {
  const [userInput, setUserInput] = useState("");
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<OpenRouterModel | null>(null);
  const { sendPrompt } = useOpenRouter();
  const navigate = useNavigate();
  const [attachments, setAttachments] = useState<{
    id: string;
    fileName: string;
    mimeType: string;
    base64: string;
    bytes: Uint8Array;
    size: number;
    url?: string; // preview object URL for images
  }[]>([]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const fetchedModels = await getModelsFromStore();
        const default_model_id = await getDefaultModel();
        const model_id = useStore.getState().conversation?.model_id;
        setModels(fetchedModels);
        if (default_model_id && !model_id) {
          setSelectedModel(
            fetchedModels.find((model) => model.id === default_model_id) ||
              null,
          );
          return;
        }
        console.log("here");
        setSelectedModel(
          fetchedModels.find((model) => model.id === model_id) || null,
        );
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    };
    loadModels();
  }, [id]);

  const sendMessage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    let chatId = id;
    if (!chatId) {
      const newId = crypto.randomUUID();
      sendPrompt(newId, userInput.trim(), selectedModel?.id ?? "", attachments);
      navigate(`/chat/${newId}`);
    } else {
      sendPrompt(chatId, userInput.trim(), selectedModel?.id ?? "", attachments);
    }

    setUserInput("");
    setAttachments([]);
  };

  async function handleFileUpload(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!selectedModel) {
      toast.error("Select a model first");
      return;
    }
    if (selectedModel.provider !== "OpenRouter") {
      toast.error("Attachments are supported only for OpenRouter models");
      return;
    }

    const files = await openFile({
      multiple: true,
      directory: false,
    });

    const paths = Array.isArray(files) ? files : files ? [files] : [];
    if (paths.length === 0) return;

    const extToMime = (name: string) => {
      const lower = name.toLowerCase();
      if (/(\.png|\.apng)$/.test(lower)) return "image/png";
      if (/\.jpe?g$/.test(lower)) return "image/jpeg";
      if (/\.gif$/.test(lower)) return "image/gif";
      if (/\.webp$/.test(lower)) return "image/webp";
      if (/\.svg$/.test(lower)) return "image/svg+xml";
      if (/\.pdf$/.test(lower)) return "application/pdf";
      if (/\.txt$/.test(lower)) return "text/plain";
      if (/\.md$/.test(lower)) return "text/markdown";
      if (/\.json$/.test(lower)) return "application/json";
      return "application/octet-stream";
    };

    const supportsImages = !!selectedModel.architecture?.input_modalities?.includes("image");

    const newly: typeof attachments = [];
    for (const p of paths) {
      try {
        const base64 = await invoke<string>("read_and_encode_file", { filePath: p });
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const fileName = (p as string).split(/[/\\]/).pop() || "file";
        const mimeType = extToMime(fileName);
        const isImage = mimeType.startsWith("image/");

        if (isImage && !supportsImages) {
          toast.error("This model doesn't support image input");
          continue;
        }

        newly.push({
          id: crypto.randomUUID(),
          fileName,
          mimeType,
          base64,
          bytes,
          size: bytes.byteLength,
          url: isImage ? URL.createObjectURL(new Blob([bytes], { type: mimeType })) : undefined,
        });
      } catch (err) {
        console.error("Failed reading file:", err);
        toast.error("Failed to load file");
      }
      if (attachments.length + newly.length >= 2) break; // limit to 2
    }

    const next = [...attachments, ...newly].slice(0, 2);
    setAttachments(next);
  }

  return (
    <form className="flex flex-row justify-center items-center space-x-4 rounded-2xl shadow-2xl w-full z-50 p-2 relative bg-card mb-4">
      <div className="bg-background flex-1 px-4 py-2 rounded-xl flex-col items-center space-y-4 w-full">
        {attachments.length > 0 && (
          <div className="flex flex-row gap-2 flex-wrap mb-2">
            {attachments.map((att) => (
              <div key={att.id} className="border rounded-lg p-2 flex items-center gap-2 bg-card/60">
                {att.url && att.mimeType.startsWith("image/") ? (
                  <img src={att.url} alt={att.fileName} className="w-12 h-12 object-cover rounded" />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-muted rounded text-xs">
                    {att.fileName.split(".").pop()?.toUpperCase()}
                  </div>
                )}
                <div className="text-xs max-w-40 truncate">{att.fileName}</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={(el) => {
            if (el) {
              el.style.height = "auto";
              el.style.height = el.scrollHeight + "px";
            }
          }}
          className="resize-none w-full max-h-48 pr-12 bg-transparent outline-none transition-all duration-200 ease-in-out"
          placeholder="Type your message..."
          onChange={(e) => {
            setUserInput(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          value={userInput}
        />
        <div className="flex flex-row items-center space-x-2">
          <Button
            className="flex items-center justify-center h-8 w-8"
            tabIndex={-1}
            onClick={(e) => handleFileUpload(e)}
          >
            <Paperclip size={styles.iconSize} className="flex-shrink-0" />
          </Button>
          {!useIsMobile() ? (
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="flex items-center justify-center h-8 px-3 rounded-full"
                    variant="outline"
                  >
                    {selectedModel ? <>{selectedModel.name}</> : <>Set model</>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <ModelsList
                    models={models}
                    setSelectedModel={setSelectedModel}
                  />
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <Drawer open={open} onOpenChange={setOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant={"outline"}
                  className="flex items-center justify-center h-8 px-3 rounded-full"
                >
                  {selectedModel ? <>{selectedModel.name}</> : <>+ Set model</>}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="w-full">
                <ModelsList
                  models={models}
                  setSelectedModel={setSelectedModel}
                />
              </DrawerContent>
            </Drawer>
          )}
        </div>
      </div>

      <Button
        className="flex items-center justify-center h-12 w-12"
        onClick={(e) => {
          if (!selectedModel) {
            alert("Please select a model before sending.");
            return;
          }
          sendMessage(e);
        }}
        disabled={!selectedModel}
      >
        <Send size={styles.iconSize} className="flex-shrink-0" />
      </Button>
    </form>
  );
}

function ModelsList({
  models,
  setSelectedModel,
}: {
  models: OpenRouterModel[];
  setSelectedModel: (model: OpenRouterModel) => void;
}) {
  const openRouterModels = models.filter(
    (model) => model.provider === "OpenRouter",
  );
  const geminiModels = models.filter((model) => model.provider === "Gemini");
  const [searchValue, setSearchValue] = useState(""); // Add this line
  const [defaultModel, setDefaultModel] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    const loadDefaultModel = async () => {
      setDefaultModel(await getDefaultModel());
    };

    loadDefaultModel();
  }, []);

  const handleSaveDefaultModel = async (modelId: string) => {
    if (modelId === defaultModel) {
      toast.error("That's already the default model");
      return;
    }
    await saveDefaultModel(modelId);
    setDefaultModel(modelId);
  };

  return (
    <Command className="mt-4">
      <CommandInput
        placeholder="Search model..."
        value={searchValue}
        onValueChange={setSearchValue}
      />
      <CommandList>
        <CommandEmpty>No model found.</CommandEmpty>
        {openRouterModels.length > 0 && (
          <CommandGroup heading="OpenRouter Models">
            {openRouterModels.map((model) => (
              <div className="flex flex-row items-center w-full">
                <CommandItem
                  key={model.id}
                  onSelect={() => {
                    setSelectedModel(model);
                  }}
                  className="w-full"
                >
                  {model.name}
                </CommandItem>
                {searchValue === "" && (
                  <CommandShortcut>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-0 z-50"
                      onClick={() => saveDefaultModel(model.id)}
                    >
                      <Star />
                    </Button>
                  </CommandShortcut>
                )}
              </div>
            ))}
          </CommandGroup>
        )}
        {geminiModels.length > 0 && (
          <CommandGroup heading="Gemini Models">
            {geminiModels.map((model) => (
              <div className="flex flex-row items-center w-full">
                <CommandItem
                  key={model.id}
                  onSelect={() => {
                    setSelectedModel(model);
                  }}
                  className="w-full"
                >
                  {model.name}
                </CommandItem>
                {searchValue === "" && (
                  <CommandShortcut>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-0 z-50"
                      onClick={() => handleSaveDefaultModel(model.id)}
                    >
                      {model.id === defaultModel ? (
                        <Star className="text-yellow-300" />
                      ) : (
                        <Star />
                      )}
                    </Button>
                  </CommandShortcut>
                )}
              </div>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
