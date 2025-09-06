import { useOpenRouter } from "@/providers/providers-service";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { OpenRouterModel, GeminiModel, useStore, GeminiTool } from "@/utils/state";
import { getModelsFromStore, saveFavoriteModel, removeFavoriteModel, isFavoriteModel, getGeminiTools, getGeminiThinking } from "@/utils/store";
import { toast } from "sonner";
import ModelPicker from "./ModelPicker";
import ModelParameters from "./ModelParameters";
import ReasoningPicker from "./ReasoningPicker";
import GeminiToolsPicker from "./GeminiToolsPicker";
import GeminiThinkingPicker from "./GeminiThinkingPicker";
import AttachmentStrip from "./AttachmentStrip";
import { useAttachments } from "@/hooks/useAttachments";
import { useResponsiveControls } from "@/hooks/useResponsiveControls";

export default function ChatInput({ id }: { id: string }) {
  const [userInput, setUserInput] = useState("");
  const [models, setModels] = useState<(OpenRouterModel | GeminiModel)[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<(OpenRouterModel | GeminiModel) | null>(null);
  const [selectedGeminiTools, setSelectedGeminiTools] = useState<GeminiTool[]>([]);
  const [geminiThinking, setGeminiThinking] = useState<boolean>(true);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [parametersOpen, setParametersOpen] = useState(false);
  const { sendPrompt } = useOpenRouter();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const conversationModelId = useStore((s) => s.conversation?.model_id);
  const { getModelParameters, loadModelParameters, getReasoningLevel, setReasoningLevel } = useStore();
  const reasoningLevel = getReasoningLevel();
  const { attachments, handleFileUpload, removeAttachment, setAttachments, isProcessing } = useAttachments(selectedModel);

  // Use responsive controls hook for better space management
  const { containerRef, hasSpaceForInline } = useResponsiveControls({
    minSpaceForInline: 400,
    breakpoint: 640
  });

  useEffect(() => {
    const loadModels = async () => {
      try {
        const [openRouterModels, geminiModels] = await getModelsFromStore();
        const fetchedModels = [...openRouterModels, ...geminiModels];
        const model_id = conversationModelId;

        await loadModelParameters();

        const defaultTools = await getGeminiTools();
        setSelectedGeminiTools(defaultTools as GeminiTool[]);

        // Load default Gemini thinking setting
        const defaultThinking = await getGeminiThinking();
        setGeminiThinking(defaultThinking);

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

  const shouldShowInline = hasSpaceForInline && selectedModel;
  const hasProviderSpecificControls = (selectedModel as any)?.provider === 'OpenRouter' || (selectedModel as any)?.provider === 'Gemini';

  const sendMessage = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault();
    if (!userInput.trim()) return;

    if (isProcessing) {
      toast.error("Please wait for images to finish processing");
      return;
    }

    const modelId = (selectedModel as any)?.id ?? "";
    const parameters = modelId ? getModelParameters(modelId) : undefined;
    const isGeminiModel = (selectedModel as any)?.provider === 'Gemini';

    const isOpenRouterModel = (selectedModel as any)?.provider === 'OpenRouter';
    let enhancedParameters = isOpenRouterModel ? {
      ...parameters,
      reasoningLevel
    } : parameters;

    // Add Gemini-specific parameters if it's a Gemini model
    if (isGeminiModel) {
      enhancedParameters = {
        ...enhancedParameters,
        gemini_thinking: geminiThinking
      };

      if (selectedGeminiTools.length > 0) {
        enhancedParameters.gemini_tools = selectedGeminiTools;
      }
    }

    let chatId = id;
    if (!chatId) {
      const newId = crypto.randomUUID();
      sendPrompt(newId, userInput.trim(), modelId, attachments, enhancedParameters);
      navigate(`/chat/${newId}`);
    } else {
      sendPrompt(chatId, userInput.trim(), modelId, attachments, enhancedParameters);
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
            <div ref={containerRef} className="flex items-center gap-2 w-full min-w-0 overflow-x-auto">
              <div className="flex items-center gap-2 flex-shrink-0">
                <ModelPicker
                  models={models}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  open={open}
                  setOpen={setOpen}
                  handleToggleFavorite={handleToggleFavorite}
                />

                {/* Model parameters button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95 flex-shrink-0"
                  disabled={!selectedModel}
                  onClick={() => setParametersOpen(true)}
                  title="Configure model parameters"
                  aria-label="Configure model parameters"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </Button>

                {/* More options button - only show when there's NOT enough space for inline controls */}
                {hasProviderSpecificControls && !shouldShowInline && (
                  <Popover open={showMoreOptions} onOpenChange={setShowMoreOptions}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95 flex-shrink-0"
                        disabled={!selectedModel}
                        aria-label="More options"
                        title="More options"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                        </svg>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Model Options</h4>
                        <div className="space-y-3">
                          {(selectedModel as any)?.provider === 'OpenRouter' && (
                            <div>
                              <label className="text-xs text-muted-foreground mb-2 block">Reasoning Level</label>
                              <ReasoningPicker
                                reasoningLevel={reasoningLevel}
                                setReasoningLevel={setReasoningLevel}
                                disabled={!selectedModel}
                                compact={true}
                              />
                            </div>
                          )}
                          {(selectedModel as any)?.provider === 'Gemini' && (
                            <>
                              <div>
                                <label className="text-xs text-muted-foreground mb-2 block">Thinking Mode</label>
                                <GeminiThinkingPicker
                                  thinkingEnabled={geminiThinking}
                                  setThinkingEnabled={setGeminiThinking}
                                  disabled={!selectedModel}
                                  compact={true}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-2 block">Tools Configuration</label>
                                <GeminiToolsPicker
                                  selectedTools={selectedGeminiTools}
                                  onToolsChange={setSelectedGeminiTools}
                                  disabled={!selectedModel}
                                  compact={true}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {shouldShowInline && hasProviderSpecificControls && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(selectedModel as any)?.provider === 'OpenRouter' && (
                    <ReasoningPicker
                      reasoningLevel={reasoningLevel}
                      setReasoningLevel={setReasoningLevel}
                      disabled={!selectedModel}
                    />
                  )}
                  {(selectedModel as any)?.provider === 'Gemini' && (
                    <>
                      {/* Only show thinking picker for models that support it */}
                      {selectedModel?.thinking == true && (
                        <GeminiThinkingPicker
                          thinkingEnabled={geminiThinking}
                          setThinkingEnabled={setGeminiThinking}
                          disabled={!selectedModel}
                        />
                      )}
                      <GeminiToolsPicker
                        selectedTools={selectedGeminiTools}
                        onToolsChange={setSelectedGeminiTools}
                        disabled={!selectedModel}
                      />
                    </>
                  )}
                </div>
              )}

              {/* Status indicators - minimal space usage */}
              <div className="flex items-center gap-1 ml-auto flex-shrink-0 min-w-0">
                {(selectedModel as any)?.provider === 'OpenRouter' && reasoningLevel !== 'medium' && (
                  <div className="hidden sm:flex">
                    <span className="text-xs px-2 py-1 bg-accent/20 rounded-full text-muted-foreground truncate">
                      {reasoningLevel}
                    </span>
                  </div>
                )}
                {(selectedModel as any)?.provider === 'Gemini' && (
                  <div className="hidden sm:flex gap-1">
                    {!geminiThinking && (
                      <span className="text-xs px-2 py-1 bg-accent/20 rounded-full text-muted-foreground">
                        no thinking
                      </span>
                    )}
                    {selectedGeminiTools.length > 0 && (
                      <span className="text-xs px-2 py-1 bg-accent/20 rounded-full text-muted-foreground">
                        {selectedGeminiTools.length} tool{selectedGeminiTools.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
                {/* Mobile indicator - just show dots if there are active settings */}
                <div className="sm:hidden">
                  {((selectedModel as any)?.provider === 'OpenRouter' && reasoningLevel !== 'medium') ||
                    ((selectedModel as any)?.provider === 'Gemini' && (!geminiThinking || selectedGeminiTools.length > 0)) ? (
                    <div className="w-2 h-2 bg-accent rounded-full" title="Active settings" />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <ModelParameters
          open={parametersOpen}
          onOpenChange={setParametersOpen}
          selectedModel={selectedModel}
        />
      </form >
    </div >
  );
}

