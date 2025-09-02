import { useLoading, useStore, useUIVisibility } from "@/utils/state";
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
import { useEffect, useRef } from "react";

export default function ChatMessages() {
  const messages = useStore((state) => state.conversation?.messages);
  const loading = useLoading((state) => state.loading);
  const { setHeaderVisible, setChatInputVisible, setChatExpanded, isChatExpanded } = useUIVisibility();
  const lastScrollTop = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Get the parent scroll container instead of the messages container
    const scrollContainer = document.getElementById('chat-messages-scroll-container');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const currentScrollTop = scrollContainer.scrollTop;
      const scrollHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;
      const isScrollingDown = currentScrollTop > lastScrollTop.current;
      const isScrollingUp = currentScrollTop < lastScrollTop.current;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - currentScrollTop) < 5; // 5px threshold

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      if (isAtBottom) {
        // Show UI elements when at the bottom
        setHeaderVisible(true);
        setChatInputVisible(true);
        setChatExpanded(false);
      } else if (isScrollingDown && currentScrollTop > 50) {
        setHeaderVisible(false);
        setChatInputVisible(false);
        setChatExpanded(true);
      } else if (isScrollingUp || currentScrollTop <= 50) {
        setHeaderVisible(true);
        setChatInputVisible(true);
        setChatExpanded(false);
      }

      scrollTimeout.current = setTimeout(() => {
        setHeaderVisible(true);
        setChatInputVisible(true);
        setChatExpanded(false);
      }, 2000); // Show again after 2 seconds of no scrolling

      lastScrollTop.current = currentScrollTop;
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [setHeaderVisible, setChatInputVisible, setChatExpanded]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
        <p className="text-sm">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Code copied to clipboard");
  };

  return (
    <div className={`flex flex-col space-y-2 w-full max-w-full transition-all duration-300 px-4 py-16`}>
      {messages.map((message, index) => {
        if (message.role === "user") {
          return (
            <div
              key={message.id || `user-${index}`}
              className="flex justify-end items-end flex-col space-y-2 w-full max-w-full"
            >
              {message.files && message.files.length > 0 && (
                <div className="flex flex-row gap-2 flex-wrap ml-auto max-w-full">
                  {message.files.slice(0, 2).map((f) => {
                    const isImage = f.mime_type.startsWith("image/");
                    let preview: string | undefined;
                    if (isImage) {
                      try {
                        // @ts-ignore
                        const blob = new Blob([f.data], { type: f.mime_type });
                        preview = URL.createObjectURL(blob);
                      } catch { }
                    }
                    return (
                      <div key={f.id} className="border rounded-lg p-2 bg-card w-fit max-w-[50%] min-w-0">
                        {isImage && preview ? (
                          <img src={preview} className="max-w-[200px] max-h-[200px] object-cover rounded" />
                        ) : (
                          <div className="text-xs flex items-center gap-2 min-w-0">
                            <span className="px-2 py-1 bg-muted rounded truncate">{f.file_name}</span>
                            <span className="opacity-60 flex-shrink-0">{Math.round(f.size / 1024)} KB</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div
                className={`message user ml-auto px-4 py-2 bg-card w-fit rounded-2xl break-words transition-all duration-300 ${isChatExpanded ? 'max-w-[90%]' : 'max-w-[80%]'
                  } min-w-0`}
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
                        <div className="relative w-full max-w-full">
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
                          <div className="w-full max-w-full overflow-x-auto">
                            {
                              // @ts-ignore
                              <SyntaxHighlighter
                                {...rest}
                                PreTag="div"
                                children={String(children).replace(/\n$/, "")}
                                language={match[1]}
                                style={atomDark}
                                customStyle={{
                                  margin: 0,
                                  maxWidth: '100%',
                                  overflowX: 'auto',
                                  fontSize: '14px',
                                  whiteSpace: 'pre'
                                }}
                                wrapLongLines={false}
                              />
                            }
                          </div>
                        </div>
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
        } else {
          return (
            <div
              key={message.id || `ai-${index}`}
              className={`message assistant w-full min-w-0 transition-all duration-300 ${isChatExpanded ? 'max-w-full' : 'max-w-full'
                }`}
            >
              {message.files && message.files.length > 0 && (
                <div className="flex flex-row gap-2 flex-wrap max-w-full">
                  {message.files.slice(0, 2).map((f) => {
                    const isImage = f.mime_type.startsWith("image/");
                    let preview: string | undefined;
                    if (isImage) {
                      try {
                        // @ts-ignore
                        const blob = new Blob([f.data], { type: f.mime_type });
                        preview = URL.createObjectURL(blob);
                      } catch { }
                    }
                    return (
                      <div key={f.id} className="border rounded-lg p-2 bg-card w-fit max-w-[50%] min-w-0">
                        {isImage && preview ? (
                          <img src={preview} className="max-w-[200px] max-h-[200px] object-cover rounded" />
                        ) : (
                          <div className="text-xs flex items-center gap-2 min-w-0">
                            <span className="px-2 py-1 bg-muted rounded truncate">{f.file_name}</span>
                            <span className="opacity-60 flex-shrink-0">{Math.round(f.size / 1024)} KB</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
