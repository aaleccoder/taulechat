import { Send, Paperclip, Star, X } from "lucide-react";
import { useOpenRouter } from "@/providers/providers-service";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { OpenRouterModel, GeminiModel, useStore } from "@/utils/state";
import {
  getDefaultModel,
  getModelsFromStore,
  saveDefaultModel,
} from "@/utils/store";
import { Drawer, DrawerContent, DrawerTrigger } from "./ui/drawer";
import React from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const conversationModelId = useStore((s) => s.conversation?.model_id);
  const [attachments, setAttachments] = useState<{
    id: string;
    fileName: string;
    mimeType: string;
    base64: string;
    bytes: Uint8Array;
    size: number;
    url?: string;
  }[]>([]);
  const [defaultModelId, setDefaultModelId] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    const loadModels = async () => {
      try {
        const [openRouterModels, geminiModels] = await getModelsFromStore();
        const fetchedModels = [...openRouterModels, ...geminiModels];

        const default_model_id = await getDefaultModel();
        const model_id = conversationModelId;
        setModels(fetchedModels);

        if (model_id) {
          const fromConversation =
            fetchedModels.find((model) => (model as any).id === model_id) || null;
          setSelectedModel(fromConversation);
          setDefaultModelId(default_model_id);
          return;
        }

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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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
    <div className="flex justify-center items-center w-full h-full mx-auto">
      <form
        role="form"
        aria-label="Chat input"
        className="chat-input-form"
      >
        <div className="flex flex-row justify-center items-center w-full">
          <div className="model-picker-row w-full">

            <Drawer open={open} onOpenChange={setOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  className="model-select-btn"
                  aria-label="Select model"
                >
                  {selectedModel ? (
                    <span className="truncate">
                      {(selectedModel as any).name || (selectedModel as any).displayName || (selectedModel as any).id}
                    </span>
                  ) : (
                    <>+ Select model</>
                  )}
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
              className="star-btn"
              disabled={!selectedModel}
              onClick={handleQuickSetDefault}
              title={
                selectedModel && (selectedModel as any)?.id === defaultModelId
                  ? "Default model"
                  : "Set as default"
              }
              aria-label="Toggle default model"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={`size-6 ${selectedModel && (selectedModel as any)?.id === defaultModelId
                  ? "text-yellow-300"
                  : ""
                  }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                />
              </svg>
            </Button>
          </div>
        </div>
        {/* Model picker row (pill above the input) */}
        {/* Attachments strip */}
        {attachments.length > 0 && (
          <div className="attachments-strip" aria-label="Attachments preview">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="attachment-item"
              >
                {att.url && att.mimeType.startsWith("image/") ? (
                  <img
                    src={att.url}
                    alt={att.fileName}
                    className="attachment-img"
                  />
                ) : (
                  <div className="attachment-file-icon">
                    {att.fileName.split(".").pop()?.toUpperCase()}
                  </div>
                )}
                <div className="attachment-details">
                  <div className="attachment-name" title={att.fileName}>{att.fileName}</div>
                  <div className="attachment-size">{Math.round(att.size / 1024)} KB</div>
                </div>
                <Button
                  type="button"
                  aria-label={`Remove ${att.fileName}`}
                  title="Remove attachment"
                  variant="ghost"
                  size="icon"
                  className="attachment-remove-btn"
                  onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Input pill bar */}
        <div className="input-bar items-center justify-center">
          <div
            className="input-container items-center justify-center"
          >
            {/* Leading actions */}
            <Button
              className="attach-btn"
              aria-label="Add attachment"
              title="Add attachment"
              variant="ghost"
              type="button"
              onClick={(e) => handleFileUpload(e)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
              </svg>

            </Button>

            {/* Textarea */}
            <div className="textarea-wrapper">
              <label htmlFor="chat-textarea" className="sr-only">Message</label>
              <textarea
                id="chat-textarea"
                ref={(el) => {
                  textareaRef.current = el;
                  if (el) {
                    el.style.height = "auto";
                    el.style.height = Math.min(el.scrollHeight, 192) + "px"; // cap ~12rem
                  }
                }}
                rows={1}
                aria-multiline
                aria-label="Type your message"
                className="textarea"
                placeholder="Type your message…"
                onChange={(e) => {
                  setUserInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 192) + "px";
                }}
                value={userInput}
              />
            </div>

            <Button
              className="attach-btn"
              aria-label="Send message"
              onClick={(e) => {
                if (!selectedModel) {
                  alert("Please select a model before sending.");
                  return;
                }
                sendMessage(e);
              }}
              variant={"ghost"}
              type="button"
              disabled={!selectedModel || !userInput.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>

            </Button>

            {/* trailing space keeps padding symmetric */}
          </div>

          {/* Primary send action aligned right for thumb reachability */}

        </div>
      </form>
    </div>
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
  const [providerFilter, setProviderFilter] = useState<"all" | "OpenRouter" | "Gemini">("all");
  const [searchValue, setSearchValue] = useState("");
  // Unified model list, sorted by provider for label separation
  const filteredModels = models.filter((model) => {
    if (providerFilter === "all") return true;
    return (model as any)?.provider === providerFilter;
  });
  // Sort so OpenRouter comes first, then Gemini
  filteredModels.sort((a, b) => {
    const pa = (a as any)?.provider;
    const pb = (b as any)?.provider;
    if (pa === pb) return 0;
    if (pa === "OpenRouter") return -1;
    return 1;
  });
  const openRouterCount = models.filter((m) => (m as any)?.provider === "OpenRouter").length;
  const geminiCount = models.filter((m) => (m as any)?.provider === "Gemini").length;
  const [defaultModel, setDefaultModel] = useState<string | undefined>(undefined);

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
    <div role="listbox" aria-label="Model picker" className="models-list">
      {/* Search input */}
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search model..."
          aria-label="Search model"
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
        />
      </div>
      <div className="filter-select-wrapper">
        <Select value={providerFilter} onValueChange={v => setProviderFilter(v as any)}>
          <SelectTrigger className="filter-select">
            <SelectValue aria-label="Filter by provider">
              {providerFilter === "all"
                ? `All (${openRouterCount + geminiCount})`
                : providerFilter === "OpenRouter"
                  ? `OpenRouter (${openRouterCount})`
                  : `Gemini (${geminiCount})`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({openRouterCount + geminiCount})</SelectItem>
            <SelectItem value="OpenRouter">OpenRouter ({openRouterCount})</SelectItem>
            <SelectItem value="Gemini">Gemini ({geminiCount})</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Model list */}
      <div className="model-list-container">
        {filteredModels.length === 0 ? (
          <div className="no-models">No model found.</div>
        ) : (
          <div className="inner-model-list">
            {(() => {
              let lastProvider: string | null = null;
              return filteredModels
                .filter((model) => {
                  const name = (model as any).name || (model as any).displayName || (model as any).id;
                  return name?.toLowerCase().includes(searchValue.toLowerCase());
                })
                .map((model, idx, arr) => {
                  const provider = (model as any)?.provider;
                  const name = (model as any).name || (model as any).displayName || (model as any).id;
                  const supportsImage = provider === "OpenRouter" && Array.isArray((model as any)?.architecture?.input_modalities) && (model as any).architecture.input_modalities.includes("image");
                  const showLabel = provider !== lastProvider;
                  lastProvider = provider;
                  return (
                    <React.Fragment key={name}>
                      {showLabel && (
                        <div className={
                          provider === "OpenRouter"
                            ? "provider-label-openrouter"
                            : "provider-label-gemini"
                        }>
                          {provider}
                        </div>
                      )}
                      <div
                        role="option"
                        aria-selected={false}
                        tabIndex={0}
                        className="model-pill model-pill-default"
                        onClick={() => { setOpen(false); setSelectedModel(model); }}
                        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { setOpen(false); setSelectedModel(model); } }}
                      >
                        <span className="model-name">{name}</span>
                        {/* Image modality badge for OpenRouter only */}
                        {supportsImage && (
                          <span className="image-badge" title="Supports image input">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-blue-500"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" /><circle cx="8.5" cy="13.5" r="2.5" stroke="currentColor" strokeWidth="2" /><path d="M21 19l-5-6-4 5-3-4-4 5" stroke="currentColor" strokeWidth="2" /></svg>
                          </span>
                        )}
                      </div>
                    </React.Fragment>
                  );
                });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
