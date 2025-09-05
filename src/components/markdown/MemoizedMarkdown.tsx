import { memo, FC, ComponentProps } from "react";
import Markdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import CodeBlock from "../CodeBlock";
import LinkPreviewTooltip from "../LinkPreviewTooltip";

const MemoizedCodeBlock = memo(CodeBlock);

const Anchor: FC<ComponentProps<'a'>> = ({ href, children }) => {
    if (!href) return null;
    return (
        <LinkPreviewTooltip href={href}>
            <span className="cursor-pointer !no-underline bg-accent/20 px-2 rounded-full py-1 text-xs hover:bg-accent/10 transition">
                {children}
            </span>
        </LinkPreviewTooltip>
    );
};

const createCodeBlock = (onCopy: (text: string) => void): FC<ComponentProps<'code'>> => (props) => {
    const { children, className, ...rest } = props;
    const codeText = String(children);
    const match = /language-(\w+)/.exec(className || "");
    return match ? (
        <MemoizedCodeBlock
            code={codeText}
            language={match[1]}
            onCopy={() => onCopy(codeText)}
            variant="assistant"
        />
    ) : (
        <code {...rest} className={className}>
            {children}
        </code>
    );
};

const MemoizedMarkdown = memo(({ content, onCopy }: { content: string, onCopy: (text: string) => void }) => {
    const markdownComponents: Components = {
        a: Anchor,
        code: createCodeBlock(onCopy),
    };

    return (
        <Markdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
        >
            {content}
        </Markdown>
    );
});

export default MemoizedMarkdown;
