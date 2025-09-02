import { Send, Paperclip, Star } from "lucide-react";
import { useOpenRouter } from "@/providers/providers-service";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { styles } from "@/constants/style";
import { OpenRouterModel, GeminiModel, useStore } from "@/utils/state";
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
// Removed unused Popover and useIsMobile imports
import { Drawer, DrawerContent, DrawerTrigger } from "./ui/drawer";
import React from "react";
import { toast } from "sonner";
import { open as openFile } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

export default function ChatInput({ id }: { id: string }) {
  const [userInput, setUserInput] = useState("");
  const [models, setModels] = useState<(OpenRouterModel | GeminiModel)[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<
    (OpenRouterModel | GeminiModel) | null
  >(null);
  const { sendPrompt } = useOpenRouter();
  const navigate = useNavigate();
  // Subscribe to conversation model id to react when a new conversation is created asynchronously
  const conversationModelId = useStore((s) => s.conversation?.model_id);
  const [attachments, setAttachments] = useState<{
    id: string;
    fileName: string;
    mimeType: string;
    base64: string;
    bytes: Uint8Array;
    size: number;
    url?: string; // preview object URL for images
  }[]>([]);
  const [defaultModelId, setDefaultModelId] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    const loadModels = async () => {
      try {
        const [openRouterModels, geminiModels] = await getModelsFromStore();
        const fetchedModels = [...openRouterModels, ...geminiModels];

        const default_model_id = await getDefaultModel();
        const model_id = conversationModelId;
        setModels(fetchedModels);

        // Prefer the conversation's model if available
        if (model_id) {
          const fromConversation =
            fetchedModels.find((model) => (model as any).id === model_id) || null;
          setSelectedModel(fromConversation);
          setDefaultModelId(default_model_id);
          return;
        }

        // Otherwise, only fall back to default if user hasn't selected one yet
        // and we're not in a specific chat (avoid overriding during first navigation)
        if (!id && !selectedModel && default_model_id) {
          const fromDefault =
            fetchedModels.find((model) => (model as any).id === default_model_id) || null;
          setSelectedModel(fromDefault);
        }
        setDefaultModelId(default_model_id);
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    };
    loadModels();
  }, [id, conversationModelId, selectedModel]);

  // Refresh default model when closing the picker, to stay in sync with changes done inside it
  useEffect(() => {
    if (!open) {
      getDefaultModel()
        .then((m) => setDefaultModelId(m))
        .catch((err) => console.error("Error loading default model:", err));
    }
  }, [open]);

  const sendMessage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    let chatId = id;
    if (!chatId) {
      const newId = crypto.randomUUID();
      sendPrompt(newId, userInput.trim(), (selectedModel as any)?.id ?? "", attachments);
      navigate(`/chat/${newId}`);
    } else {
      sendPrompt(chatId, userInput.trim(), (selectedModel as any)?.id ?? "", attachments);
    }

    setUserInput("");
    setAttachments([]);
  };

  const handleQuickSetDefault = async () => {
    if (!selectedModel) {
      toast.error("Select a model first");
      return;
    }
    const modelId = (selectedModel as any)?.id as string | undefined;
    if (!modelId) {
      toast.error("Invalid model");
      return;
    }
    if (modelId === defaultModelId) {
      toast.error("That's already the default model");
      return;
    }
    await saveDefaultModel(modelId);
    setDefaultModelId(modelId);
    toast.success("Default model updated");
  };

  async function handleFileUpload(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!selectedModel) {
      toast.error("Select a model first");
      return;
    }
    const isOpenRouter = (selectedModel as any)?.provider === "OpenRouter";
    if (!isOpenRouter) {
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

    const supportsImages = !!(selectedModel as any)?.architecture?.input_modalities?.includes(
      "image",
    );

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
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button
                variant={"outline"}
                className="flex items-center justify-center h-8 px-3 rounded-full"
              >
                {selectedModel ? <>{(selectedModel as any).name || (selectedModel as any).displayName || (selectedModel as any).id}</> : <>+ Set model</>}
              </Button>
            </DrawerTrigger>
            <DrawerContent className="w-full">
              <ModelsList
                models={models}
                setSelectedModel={setSelectedModel}
                setOpen={setOpen}
              />
            </DrawerContent>
          </Drawer>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!selectedModel}
            onClick={handleQuickSetDefault}
            title={
              selectedModel && (selectedModel as any)?.id === defaultModelId
                ? "Default model"
                : "Set as default"
            }
          >
            <Star
              className={
                selectedModel && (selectedModel as any)?.id === defaultModelId
                  ? "text-yellow-300"
                  : ""
              }
            />
          </Button>
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
  setOpen
}: {
  models: (OpenRouterModel | GeminiModel)[];
  setSelectedModel: (model: OpenRouterModel | GeminiModel) => void;
  setOpen: (open: boolean) => void;
}) {
  const openRouterModels = models.filter(
    (model) => (model as any)?.provider === "OpenRouter",
  ) as OpenRouterModel[];
  const geminiModels = models.filter(
    (model) => (model as any)?.provider === "Gemini",
  ) as GeminiModel[];
  const [searchValue, setSearchValue] = useState(""); // Add this line
  const [defaultModel, setDefaultModel] = useState<string | undefined>(
    undefined,
  );
  const [providerFilter, setProviderFilter] = useState<"all" | "OpenRouter" | "Gemini">("all");

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
      {/* Provider filter tabs */}
      <div className="flex items-center gap-2 px-3 py-2 border-b overflow-x-auto">
        <Button
          size="sm"
          variant={providerFilter === "all" ? "default" : "outline"}
          onClick={() => setProviderFilter("all")}
        >
          All <span className="ml-2 rounded-full bg-primary/10 text-primary text-[10px] px-2 py-0.5">
            {openRouterModels.length + geminiModels.length}
          </span>
        </Button>
        <Button
          size="sm"
          variant={providerFilter === "OpenRouter" ? "default" : "outline"}
          onClick={() => setProviderFilter("OpenRouter")}
        >
          OpenRouter
          <span className="ml-2 rounded-full bg-blue-500/10 text-blue-500 text-[10px] px-2 py-0.5">
            {openRouterModels.length}
          </span>
        </Button>
        <Button
          size="sm"
          variant={providerFilter === "Gemini" ? "default" : "outline"}
          onClick={() => setProviderFilter("Gemini")}
        >
          Gemini
          <span className="ml-2 rounded-full bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5">
            {geminiModels.length}
          </span>
        </Button>
      </div>
      <CommandList>
        <CommandEmpty>No model found.</CommandEmpty>
        {(providerFilter === "all" || providerFilter === "OpenRouter") && openRouterModels.length > 0 && (
          <CommandGroup
            heading={
              <div className="flex items-center text-sm font-medium">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                  OpenRouter
                </span>
                <span className="ml-2 rounded-full bg-blue-500/10 text-blue-500 text-[10px] px-2 py-0.5">
                  {openRouterModels.length}
                </span>
              </div>
            }
          >
            {openRouterModels.map((model) => (
              <div key={model.id} className="flex flex-row items-center w-full">
                <CommandItem
                  key={model.id}
                  onSelect={() => {
                    setOpen(false);
                    setSelectedModel(model);
                  }}
                  className="w-full"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="truncate">{model.name}</span>
                    <span className="ml-auto rounded-full bg-blue-500/10 text-blue-500 text-[10px] px-2 py-0.5">OpenRouter</span>
                  </div>
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
        {(providerFilter === "all" || providerFilter === "Gemini") && geminiModels.length > 0 && (
          <CommandGroup
            heading={
              <div className="flex items-center text-sm font-medium">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                  Gemini
                </span>
                <span className="ml-2 rounded-full bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5">
                  {geminiModels.length}
                </span>
              </div>
            }
          >
            {geminiModels.map((model) => {
              const id = (model as any).id as string;
              const label = (model as any).name || (model as any).displayName || id;
              return (
                <div key={id} className="flex flex-row items-center w-full">
                  <CommandItem
                    key={id}
                    onSelect={() => {
                      setOpen(false);
                      setSelectedModel(model);
                    }}
                    className="w-full"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="truncate">{label}</span>
                      <span className="ml-auto rounded-full bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5">Gemini</span>
                    </div>
                  </CommandItem>
                  {searchValue === "" && (
                    <CommandShortcut>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="p-0 z-50"
                        onClick={() => handleSaveDefaultModel(id)}
                      >
                        {id === defaultModel ? (
                          <Star className="text-yellow-300" />
                        ) : (
                          <Star />
                        )}
                      </Button>
                    </CommandShortcut>
                  )}
                </div>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
