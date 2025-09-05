import { useOpenRouter } from "@/providers/providers-service";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { OpenRouterModel, GeminiModel, useStore } from "@/utils/state";
import { getModelsFromStore, saveFavoriteModel, removeFavoriteModel, isFavoriteModel } from "@/utils/store";
import { toast } from "sonner";
import ModelPicker from "./ModelPicker";
import AttachmentStrip from "./AttachmentStrip";
import { useAttachments } from "@/hooks/useAttachments";

export default function ChatInput({ id }: { id: string }) {
  const [userInput, setUserInput] = useState("");
  const [models, setModels] = useState<(OpenRouterModel | GeminiModel)[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<(OpenRouterModel | GeminiModel) | null>(null);
  const { sendPrompt } = useOpenRouter();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const conversationModelId = useStore((s) => s.conversation?.model_id);
  const { getModelParameters, loadModelParameters } = useStore();
  const { attachments, handleFileUpload, removeAttachment, setAttachments, isProcessing } = useAttachments(selectedModel);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const [openRouterModels, geminiModels] = await getModelsFromStore();
        const fetchedModels = [...openRouterModels, ...geminiModels];
        const model_id = conversationModelId;

        await loadModelParameters();

        setModels(fetchedModels);
        if (model_id) {
          const fromConversation = fetchedModels.find((model) => (model as any).id === model_id) || null;
          setSelectedModel(fromConversation);
          return;
        }
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    };
    loadModels();
  }, [id, conversationModelId, loadModelParameters]);

  const sendMessage = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault();
    if (!userInput.trim()) return;

    if (isProcessing) {
      toast.error("Please wait for images to finish processing");
      return;
    }

    const modelId = (selectedModel as any)?.id ?? "";
    const parameters = modelId ? getModelParameters(modelId) : undefined;

    let chatId = id;
    if (!chatId) {
      const newId = crypto.randomUUID();
      sendPrompt(newId, userInput.trim(), modelId, attachments, parameters);
      navigate(`/chat/${newId}`);
    } else {
      sendPrompt(chatId, userInput.trim(), modelId, attachments, parameters);
    }
    setUserInput("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey) {
        e.preventDefault();
        sendMessage();
      } else {
        e.preventDefault();
        setUserInput(prev => prev + ' ');
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 192) + "px";
        }
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!selectedModel) {
      toast.error("Select a model first");
      return;
    }
    const modelId = (selectedModel as any)?.id as string | undefined;
    if (!modelId) {
      toast.error("Invalid model");
      return;
    }

    const isCurrentlyFavorite = await isFavoriteModel(modelId);

    if (isCurrentlyFavorite) {
      await removeFavoriteModel(modelId);
      toast.success("Removed from favorites");
    } else {
      await saveFavoriteModel(modelId);
      toast.success("Added to favorites");
    }
  };


  return (
    <div className="flex justify-center items-center w-full h-full mx-auto">
      <form role="form" aria-label="Chat input" className="chat-input-form w-full max-w-xl px-2 pt-2">
        <AttachmentStrip attachments={attachments} onRemove={removeAttachment} />
        <div className="w-full rounded-xl border bg-card shadow-md px-2 py-2 flex flex-col gap-2 items-center motion-safe:transition-shadow focus-within:ring-2 focus-within:ring-ring/50">
          <div className="w-full flex flex-row items-center gap-2">
            <Button
              className="h-12 w-12 rounded-full motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95"
              aria-label="Add attachment"
              title="Add attachment"
              variant="ghost"
              type="button"
              onClick={handleFileUpload}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
              </svg>
            </Button>
            <div className="flex-1">
              <label htmlFor="chat-textarea" className="sr-only">Message</label>
              <textarea
                id="chat-textarea"
                ref={(el) => {
                  textareaRef.current = el;
                  if (el) {
                    el.style.height = "auto";
                    el.style.height = Math.min(el.scrollHeight, 192) + "px";
                  }
                }}
                rows={1}
                aria-multiline
                aria-label="Type your message"
                className="max-h-48 w-full resize-none bg-transparent leading-6 outline-none placeholder:text-muted-foreground/70 motion-safe:transition-colors"
                placeholder="Type your message…"
                onChange={(e) => {
                  setUserInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 192) + "px";
                }}
                onKeyDown={handleKeyDown}
                value={userInput}
              />
            </div>
            <Button
              className="h-12 w-12 rounded-full motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95"
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
              disabled={!selectedModel || !userInput.trim() || isProcessing}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </Button>
          </div>
          <div className="w-full flex justify-start mt-1">
            <div className="max-w-xs w-full">
              <ModelPicker
                models={models}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                open={open}
                setOpen={setOpen}
                handleToggleFavorite={handleToggleFavorite}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

