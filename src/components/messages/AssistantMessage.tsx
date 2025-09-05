import { Button } from "../ui/button";
import { Clipboard } from "lucide-react";
import AttachmentPreview from "../AttachmentPreview";
import UsageMetadataDisplay from "../UsageMetadataDisplay";
import LoadingUI from "../loading";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../ui/collapsible";
import { useState, memo } from "react";
import MemoizedMarkdown from "../markdown/MemoizedMarkdown";

const AssistantMessage = memo(function AssistantMessage({ message, isChatExpanded, handleCopyToClipboard, loading }: any) {
    let renderedContent = message.content;
    if (message.groundingSupports && Array.isArray(message.groundingSupports) && message.groundingChunks) {
        renderedContent = renderedContent.replace(/\s*\[(\d+)\]\([^)]*\s*"[^"]*"\)\s*/g, "");
        const supportsSorted = [...message.groundingSupports].sort((a, b) => b.segment.endIndex - a.segment.endIndex);
        supportsSorted.forEach((support) => {
            const indices = (support.groundingChunkIndices as number[]).map((i: number) => i + 1);
            if (indices.length > 0) {
                const uniqueIndices = [...new Set(indices)];
                const chunk = uniqueIndices.map(index => message.groundingChunks[index - 1]).filter(chunk => chunk?.web?.uri)[0];
                if (chunk?.web?.uri) {
                    const beforeText = renderedContent.slice(0, support.segment.endIndex);
                    const afterText = renderedContent.slice(support.segment.endIndex);
                    const existingLink = afterText.match(/^\s*(\[.*?\]\(.*?\)|https?:\/\/[^\s]+)/);
                    if (!existingLink) {
                        const displayText = chunk.web.title || chunk.web.uri;
                        const markdownLink = `[${displayText}](${chunk.web.uri})`;
                        renderedContent = beforeText + ` ${markdownLink}` + afterText;
                    }
                }
            }
        });
    }
    const [thoughtsOpen, setThoughtsOpen] = useState(false);
    const hasThoughts = message.thoughts && message.thoughts.trim().length > 0;
    return (
        <div
            key={message.id}
            className={`message assistant w-full min-w-0 transition-all duration-300 ${isChatExpanded ? "max-w-full" : "max-w-full"}`}
        >
            {message.files && message.files.length > 0 && (
                <div className="flex flex-row gap-2 flex-wrap max-w-full">
                    {message.files.slice(0, 2).map((f: any) => (
                        <AttachmentPreview key={f.id} file={f} />
                    ))}
                </div>
            )}
            {hasThoughts && (
                <Collapsible open={thoughtsOpen} onOpenChange={setThoughtsOpen} className="mt-4 w-full">
                    <CollapsibleTrigger asChild>
                        <span
                            role="button"
                            tabIndex={0}
                            className="h-10 w-fit !border-none flex items-center gap-2 motion-safe:transition-all motion-safe:duration-150 text-foreground/70 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0 focus:outline-none text-xs"
                            aria-label={thoughtsOpen ? "Hide thought process" : "Show thought process"}
                            title={thoughtsOpen ? "Hide thought process" : "Show thought process"}
                            onClick={() => setThoughtsOpen(!thoughtsOpen)}
                            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setThoughtsOpen(!thoughtsOpen); }}
                        >
                            <span>
                                {thoughtsOpen ? "Hide thought process" : "Show thought process"}
                            </span>
                            <span aria-hidden="true">
                                {thoughtsOpen ? (
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M4 10L8 6L12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </span>
                        </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 rounded-lg border bg-background px-3 py-2 shadow-md text-muted-foreground text-sm whitespace-pre-wrap motion-safe:transition-shadow" aria-label="Assistant thought process">
                        <pre className="font-mono text-xs leading-5 whitespace-pre-wrap break-words">{message.thoughts}</pre>
                    </CollapsibleContent>
                </Collapsible>
            )}
            {loading && !message.content ? (
                <LoadingUI />
            ) : (
                <MemoizedMarkdown content={renderedContent} onCopy={handleCopyToClipboard} />
            )}

            {message.usageMetadata && (
                <UsageMetadataDisplay usageMetadata={message.usageMetadata} />
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

export default AssistantMessage;
