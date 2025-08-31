import { useLoading, useStore } from "@/utils/state";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import { Button } from "./ui/button";
import { Clipboard } from "lucide-react";
import { toast } from "sonner";
import StreamingTypeText from "./animations/StreamingTypeText";

export default function ChatMessages() {
  const messages = useStore((state) => state.conversation?.messages);
  const loading = useLoading((state) => state.loading);

  const isGenerating = loading && messages && messages.length > 0;
  const lastMessageIndex = messages ? messages.length - 1 : -1;

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        No messages yet. Start the conversation!
      </div>
    );
  }

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Code copied to clipboard");
  };

  return (
    <div className="flex flex-col px-4 py-4 space-y-4">
      {messages.map((message, index) => {
        if (message.role === "user") {
          return (
            <div
              key={message.id || `user-${index}`}
              className="flex justify-end items-end flex-col space-y-2"
            >
              <div
                className={`message ${message.role} ml-auto px-4 py-2 bg-card w-fit max-w-[50%] rounded-2xl`}
              >
                <Markdown
                  children={message.content}
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code(props) {
                      const { children, className, node, ...rest } = props;
                      const match = /language-(\w+)/.exec(className || "");
                      return match ? (
                        <div className="relative">
                          <div className="absolute right-2 top-2 z-10">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex gap-2 items-center"
                              onClick={() =>
                                handleCopyToClipboard(String(children))
                              }
                            >
                              <Clipboard className="h-4 w-4" />
                              Copy code
                            </Button>
                          </div>
                          {
                            // @ts-ignore
                            <SyntaxHighlighter
                              {...rest}
                              PreTag="div"
                              children={String(children).replace(/\n$/, "")}
                              language={match[1]}
                              style={atomDark}
                            />
                          }
                        </div>
                      ) : (
                        <code {...rest} className={className}>
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
        } else {
          return (
            <div
              key={message.id || `ai-${index}`}
              className={`message ${message.role} w-full`}
            >
              {loading && index === messages.length - 1 && !message.content ? (
                <div className="flex items-center space-x-1 py-2">
                  <span
                    className="dot bg-muted rounded-full w-2 h-2 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="dot bg-muted rounded-full w-2 h-2 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="dot bg-muted rounded-full w-2 h-2 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              ) : isGenerating && index === lastMessageIndex ? (
                <StreamingTypeText
                  text={message.content}
                  typingSpeed={10}
                  showCursor={true}
                  isComplete={!loading}
                  className="prose prose-invert max-w-none"
                />
              ) : (
                <Markdown
                  children={message.content}
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code(props) {
                      const { children, className, node, ...rest } = props;
                      const match = /language-(\w+)/.exec(className || "");
                      return match ? (
                        <div className="relative">
                          <div className="absolute right-2 top-2 z-10">
                            <Button
                              variant="outline"
                              className="flex gap-2 items-center"
                              onClick={() =>
                                handleCopyToClipboard(String(children))
                              }
                            >
                              <Clipboard className="h-4 w-4" />
                              Copy
                            </Button>
                          </div>
                          {
                            // @ts-ignore
                            <SyntaxHighlighter
                              {...rest}
                              PreTag="div"
                              children={String(children).replace(/\n$/, "")}
                              language={match[1]}
                              style={atomDark}
                            />
                          }
                        </div>
                      ) : (
                        <code {...rest} className={className}>
                          {children}
                        </code>
                      );
                    },
                  }}
                />
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
      })}
    </div>
  );
}
