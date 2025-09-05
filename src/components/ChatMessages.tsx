import { useLoading, useStore, useUIVisibility } from "@/utils/state";
import { useState } from "react";
import { toast } from "sonner";
import { useCallback } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import UserMessage from "./messages/UserMessage";
import AssistantMessage from "./messages/AssistantMessage";


export default function ChatMessages() {
  const messages = useStore((state) => state.conversation?.messages);
  const loading = useLoading((state) => state.loading);
  const { isChatExpanded } = useUIVisibility();

  // All hooks at top level
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const handleCopyToClipboard = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  }, []);
  const handleImageClick = useCallback((base64: string) => {
    setLightboxImage(base64);
  }, []);
  const handleLightboxClose = useCallback(() => setLightboxImage(null), []);
  const handleImageDownload = useCallback((base64: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = 'generated-image.png';
    link.click();
  }, []);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
        <p className="text-sm">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className={`flex flex-col space-y-2 w-full max-w-full transition-all duration-300 px-4 py-16`}>
        {messages.map((message, index) => {
          const imageFiles = (message.files || []).filter(f => f.mime_type.startsWith('image/'));
          function uint8ToBase64(u8: Uint8Array) {
            let binary = '';
            const chunk = 0x8000;
            for (let i = 0; i < u8.length; i += chunk) {
              binary += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + chunk)));
            }
            return btoa(binary);
          }
          if (imageFiles.length > 0) {
            return (
              <div key={message.id} className="flex flex-col items-start">
                {message.content && (
                  <div className="mb-2">
                    {message.content}
                  </div>
                )}
                <div className="flex gap-2 mb-2">
                  {imageFiles.map((file) => {
                    const base64 = typeof file.data === 'string' ? file.data : uint8ToBase64(file.data);
                    return (
                      <div key={file.id} className="flex flex-col items-center">
                        <img
                          src={`data:${file.mime_type};base64,${base64}`}
                          alt={file.file_name}
                          className="max-w-xs rounded-lg cursor-pointer shadow-md"
                          onClick={() => handleImageClick(base64)}
                          style={{ marginBottom: 8 }}
                        />
                        <button
                          className="mt-1 text-xs underline text-accent hover:text-accent/80"
                          onClick={() => handleImageDownload(base64)}
                          aria-label="Download image"
                        >
                          Download
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          if (message.role === "user") {
            return (
              <UserMessage
                key={message.id}
                message={message}
                isChatExpanded={isChatExpanded}
                handleCopyToClipboard={handleCopyToClipboard}
              />
            );
          } else {
            return (
              <AssistantMessage
                key={message.id}
                message={message}
                isChatExpanded={isChatExpanded}
                handleCopyToClipboard={handleCopyToClipboard}
                loading={loading && index === messages.length - 1}
              />
            );
          }
        })}
        {lightboxImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={handleLightboxClose}>
            <div className="bg-card rounded-lg p-4 shadow-lg relative" onClick={e => e.stopPropagation()}>
              <img src={`data:image/png;base64,${lightboxImage}`} alt="Large view" className="max-w-[90vw] max-h-[80vh] rounded-lg" />
              <button
                className="absolute top-2 right-2 text-foreground bg-background rounded-full px-2 py-1 shadow-md"
                onClick={handleLightboxClose}
                aria-label="Close"
              >
                Close
              </button>
              <button
                className="absolute bottom-2 right-2 text-xs underline text-accent hover:text-accent/80"
                onClick={() => handleImageDownload(lightboxImage)}
                aria-label="Download image"
              >
                Download
              </button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
