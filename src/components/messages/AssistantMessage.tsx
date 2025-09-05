import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Button } from "../ui/button";
import { Clipboard } from "lucide-react";
import AttachmentPreview from "../AttachmentPreview";
import CodeBlock from "../CodeBlock";
import UsageMetadataDisplay from "../UsageMetadataDisplay";
import GroundingSources from "../GroundingSources";
import LoadingUI from "../loading";
import LinkPreviewTooltip from "../LinkPreviewTooltip";

export default function AssistantMessage({ message, isChatExpanded, handleCopyToClipboard, loading }: any) {
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
            {loading && !message.content ? (
                <LoadingUI />
            ) : (
                <Markdown
                    children={renderedContent}
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                    components={{
                        a: ({ href, children }) => {
                            if (!href) return null;
                            return (
                                <LinkPreviewTooltip href={href} >
                                    <span className="cursor-pointer !no-underline bg-accent/20 px-2 rounded-full py-1 text-xs hover:bg-accent/10 transition">
                                        {children}
                                    </span>
                                </LinkPreviewTooltip>
                            );
                        },
                        code(props) {
                            const { children, className, ...rest } = props;
                            const match = /language-(\w+)/.exec(className || "");
                            return match ? (
                                <CodeBlock
                                    code={String(children)}
                                    language={match[1]}
                                    onCopy={handleCopyToClipboard}
                                    variant="assistant"
                                />
                            ) : (
                                <code {...rest} className={className}>
                                    {children}
                                </code>
                            );
                        },
                    }}
                />
            )}
            {message.usageMetadata && (
                <UsageMetadataDisplay usageMetadata={message.usageMetadata} />
            )}
            {message.groundingChunks && message.groundingChunks.length > 0 && (
                <GroundingSources groundingChunks={message.groundingChunks} />
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
}
