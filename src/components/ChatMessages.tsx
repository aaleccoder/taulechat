import { useLoading, useStore } from "@/utils/state";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";

export default function ChatMessages() {
  const messages = useStore((state) => state.conversation?.messages);
  const loading = useLoading((state) => state.loading);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 py-4">
      {messages.map((message, index) => {
        if (message.role === "user") {
          return (
            <div
              key={message.id || `user-${index}`}
              className="flex justify-end items-end"
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
                        // @ts-ignore
                        <SyntaxHighlighter
                          {...rest}
                          PreTag="div"
                          children={String(children).replace(/\n$/, "")}
                          language={match[1]}
                          style={atomDark}
                        />
                      ) : (
                        <code {...rest} className={className}>
                          {children}
                        </code>
                      );
                    },
                  }}
                />
              </div>
            </div>
          );
        } else {
          return (
            <div
              key={message.id || `ai-${index}`}
              className={`message ${message.role} w-full`}
            >
              {loading && index === messages.length - 1 ? (
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
                        // @ts-ignore
                        <SyntaxHighlighter
                          {...rest}
                          PreTag="div"
                          children={String(children).replace(/\n$/, "")}
                          language={match[1]}
                          style={atomDark}
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
            </div>
          );
        }
      })}
    </div>
  );
}
