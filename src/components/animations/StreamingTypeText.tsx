"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { gsap } from "gsap";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";

interface StreamingTypeTextProps {
  text: string;
  typingSpeed?: number;
  showCursor?: boolean;
  cursorCharacter?: string | React.ReactNode;
  cursorBlinkDuration?: number;
  cursorClassName?: string;
  className?: string;
  isComplete?: boolean;
  onTypingComplete?: () => void;
}

const StreamingTypeText = ({
  text,
  typingSpeed = 30,
  showCursor = true,
  cursorCharacter = "|",
  cursorBlinkDuration = 0.5,
  cursorClassName = "",
  className = "",
  isComplete = false,
  onTypingComplete,
}: StreamingTypeTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTypingFinished, setIsTypingFinished] = useState(false);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastTextRef = useRef("");

  // Reset when text changes significantly (new message)
  useEffect(() => {
    if (text !== lastTextRef.current && !text.startsWith(lastTextRef.current)) {
      setDisplayedText("");
      setCurrentIndex(0);
      setIsTypingFinished(false);
    }
    lastTextRef.current = text;
  }, [text]);

  // Typing animation effect
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (currentIndex < text.length && !isTypingFinished) {
      timeoutRef.current = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, typingSpeed);
    } else if (currentIndex >= text.length && isComplete && !isTypingFinished) {
      setIsTypingFinished(true);
      if (onTypingComplete) {
        onTypingComplete();
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    currentIndex,
    text,
    typingSpeed,
    isComplete,
    isTypingFinished,
    onTypingComplete,
  ]);

  // Cursor blinking animation
  useEffect(() => {
    if (showCursor && cursorRef.current && (!isComplete || !isTypingFinished)) {
      gsap.set(cursorRef.current, { opacity: 1 });
      gsap.to(cursorRef.current, {
        opacity: 0,
        duration: cursorBlinkDuration,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
      });
    } else if (cursorRef.current && isComplete && isTypingFinished) {
      gsap.killTweensOf(cursorRef.current);
      gsap.set(cursorRef.current, { opacity: 0 });
    }

    return () => {
      if (cursorRef.current) {
        gsap.killTweensOf(cursorRef.current);
      }
    };
  }, [showCursor, cursorBlinkDuration, isComplete, isTypingFinished]);

  // If typing is finished and message is complete, show full text immediately
  const textToRender = useMemo(() => {
    if (isComplete && isTypingFinished) {
      return text;
    }
    return displayedText;
  }, [displayedText, text, isComplete, isTypingFinished]);

  return (
    <div className={`inline-block ${className}`}>
      <Markdown
        children={textToRender}
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
      {showCursor && (!isComplete || !isTypingFinished) && (
        <span
          ref={cursorRef}
          className={`ml-1 inline-block opacity-100 ${cursorClassName}`}
        >
          {cursorCharacter}
        </span>
      )}
    </div>
  );
};

export default StreamingTypeText;
