import { Button } from "./ui/button";
import { Clipboard } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  materialDark,
  materialLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "./theme-provider";

interface CodeBlockProps {
  code: string;
  language?: string;
  onCopy?: (code: string) => void;
  variant?: "user" | "assistant";
}

export default function CodeBlock({
  code,
  language,
  onCopy,
  variant = "assistant",
}: CodeBlockProps) {
  return (
    <div className="relative w-full max-w-full ">
      <div className="absolute right-2 top-2 z-10">
        <Button
          variant={variant === "user" ? "ghost" : "outline"}
          size={variant === "user" ? "sm" : undefined}
          className="flex gap-2 items-center"
          onClick={() => onCopy && onCopy(code)}
        >
          <Clipboard className="h-4 w-4" />
          {variant === "user" ? "Copy code" : "Copy"}
        </Button>
      </div>
      <div className="w-full max-w-full overflow-x-auto font-mono">
        <SyntaxHighlighter
          PreTag="div"
          language={language}
          style={
            typeof window !== "undefined" && useTheme().mode === "dark"
              ? materialDark
              : materialLight
          }
          customStyle={{
            fontFamily: "Geist Mono",
            maxWidth: "100%",
            borderRadius: "8px",
            border: "1px solid #242424",
            overflowX: "auto",
            fontSize: "14px",
            whiteSpace: "pre",
          }}
          wrapLongLines={false}
        >
          {code.replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
