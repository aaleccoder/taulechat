import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface RawTextStreamingProps {
    text: string;
    className?: string;
    showCursor?: boolean;
    cursorCharacter?: string;
    cursorClassName?: string;
}

const RawTextStreaming = ({
    text,
    className = "",
    showCursor = true,
    cursorCharacter = "|",
    cursorClassName = "",
}: RawTextStreamingProps) => {
    const cursorRef = useRef<HTMLSpanElement>(null);

    // Cursor blinking animation
    useEffect(() => {
        if (showCursor && cursorRef.current) {
            gsap.set(cursorRef.current, { opacity: 1 });
            gsap.to(cursorRef.current, {
                opacity: 0,
                duration: 0.5,
                repeat: -1,
                yoyo: true,
                ease: "power2.inOut",
            });
        }

        return () => {
            if (cursorRef.current) {
                gsap.killTweensOf(cursorRef.current);
            }
        };
    }, [showCursor]);

    return (
        <div className={`inline-block ${className}`}>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-6 break-words">
                {text}
                {showCursor && (
                    <span
                        ref={cursorRef}
                        className={`ml-1 inline-block opacity-100 ${cursorClassName}`}
                    >
                        {cursorCharacter}
                    </span>
                )}
            </pre>
        </div>
    );
};

export default RawTextStreaming;
