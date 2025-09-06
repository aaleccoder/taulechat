import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Button } from "../ui/button";
import { Clipboard } from "lucide-react";
import AttachmentPreview from "../AttachmentPreview";
import CodeBlock from "../CodeBlock";
import { memo, useCallback } from "react";
import { useLightbox } from "@/utils/state";
import { getBase64FromData, getDataUrl } from "@/lib/utils";
import { toast } from "sonner";

const UserMessage = memo(function UserMessage({ message, isChatExpanded, handleCopyToClipboard }: any) {
    const { setLightboxImage } = useLightbox();

    const handleImageClick = useCallback((base64: string) => {
        setLightboxImage(base64);
    }, [setLightboxImage]);

    const handleImageDownload = useCallback((base64: string) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64}`;
        link.download = 'image.png';
        toast.success('Image download started! Check your Downloads folder.');
        link.click();
    }, []);

    const imageFiles = (message.files || []).filter((f: any) => f.mime_type.startsWith('image/'));
    const otherFiles = (message.files || []).filter((f: any) => !f.mime_type.startsWith('image/'));

    return (
        <div
            key={message.id}
            className="flex justify-end items-end flex-col space-y-2 w-full max-w-full"
        >
            {imageFiles.length > 0 && (
                <div className="ml-auto max-w-full">
                    <div className="flex gap-2 overflow-x-auto pb-1 rounded-xl bg-card px-2 py-2 shadow-md"
                        role="list"
                        aria-label="Image attachments">
                        {imageFiles.map((file: any) => {
                            let base64: string;
                            let dataUrl: string;

                            try {
                                base64 = getBase64FromData(file.data);
                                dataUrl = getDataUrl(file.data, file.mime_type);
                            } catch (error) {
                                console.error('Error processing image data:', error, file);
                                return null;
                            }

                            return (
                                <div
                                    key={file.id}
                                    className="flex flex-col items-center gap-1 bg-background rounded-lg p-2 shadow motion-safe:transition-shadow"
                                    role="listitem"
                                >
                                    <div className="relative mb-1">
                                        <button
                                            className="rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                            onClick={() => handleImageClick(base64)}
                                            aria-label={`Open image ${file.file_name}`}
                                            title={`Open image ${file.file_name}`}
                                            tabIndex={0}
                                        >
                                            <span className="sr-only">Open image {file.file_name}</span>
                                            <img
                                                src={dataUrl}
                                                alt={file.file_name}
                                                draggable={false}
                                                className="block w-auto h-auto max-w-[160px] max-h-48 rounded-lg object-contain"
                                                onError={(e) => {
                                                    console.error('Image failed to load:', {
                                                        src: dataUrl,
                                                        file: file,
                                                        error: e
                                                    });
                                                }}
                                            />
                                        </button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="absolute top-1 right-1 h-9 w-9 rounded-full motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95 text-xs shadow-md z-10"
                                            onClick={() => handleImageDownload(base64)}
                                            aria-label={`Download ${file.file_name}`}
                                            title={`Download ${file.file_name}`}
                                        >
                                            <span className="sr-only">Download {file.file_name}</span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 text-accent"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                aria-hidden="true"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                                            </svg>
                                        </Button>
                                    </div>

                                    <div className="text-xs text-muted-foreground truncate max-w-28" title={file.file_name}>
                                        {file.file_name}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {otherFiles.length > 0 && (
                <div className="flex flex-row gap-2 flex-wrap ml-auto max-w-full">
                    {otherFiles.slice(0, 2).map((f: any) => (
                        <AttachmentPreview key={f.id} file={f} />
                    ))}
                </div>
            )}

            {message.content && (
                <div
                    className={`message user ml-auto px-4 py-2 bg-card w-fit rounded-2xl break-words transition-all duration-300 ${isChatExpanded ? "max-w-[90%]" : "max-w-[80%]"} min-w-0`}
                >
                    <Markdown
                        children={message.content}
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex, rehypeRaw]}
                        components={{
                            code(props) {
                                const { children, className, ...rest } = props;
                                const match = /language-(\w+)/.exec(className || "");
                                return match ? (
                                    <CodeBlock
                                        code={String(children)}
                                        language={match[1]}
                                        onCopy={handleCopyToClipboard}
                                        variant="user"
                                    />
                                ) : (
                                    <code {...rest} className={`${className} break-words`}>
                                        {children}
                                    </code>
                                );
                            },
                        }}
                    />
                </div>
            )}

            <Button
                variant="ghost"
                size="icon"
                className="p-0 opacity-50 hover:opacity-100"
                onClick={() => handleCopyToClipboard(message.content)}
            >
                <Clipboard />
            </Button>
        </div>
    );
});

export default UserMessage;
