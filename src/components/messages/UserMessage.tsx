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

export default function UserMessage({ message, isChatExpanded, handleCopyToClipboard }: any) {
    return (
        <div
            key={message.id}
            className="flex justify-end items-end flex-col space-y-2 w-full max-w-full"
        >
            {message.files && message.files.length > 0 && (
                <div className="flex flex-row gap-2 flex-wrap ml-auto max-w-full">
                    {message.files.slice(0, 2).map((f: any) => (
                        <AttachmentPreview key={f.id} file={f} />
                    ))}
                </div>
            )}
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
