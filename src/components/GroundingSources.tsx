import React from "react";
import LinkPreviewTooltip from "./LinkPreviewTooltip";

interface Chunk {
    web?: {
        uri?: string;
        title?: string;
    };
}

export default function GroundingSources({ groundingChunks }: { groundingChunks: Chunk[] }) {
    return (
        <div
            className="mt-2 mb-1 px-4 py-2 rounded-xl border bg-card/70 shadow-sm flex flex-col gap-1 text-xs text-muted-foreground"
            style={{
                fontFamily: "var(--font-mono)",
                maxWidth: "fit-content",
                minWidth: "180px",
                borderColor: "var(--border)",
                background: "var(--card)",
                boxShadow: "var(--shadow-sm)",
            }}
            aria-label="Sources"
            role="contentinfo"
        >
            <div className="font-semibold text-foreground mb-1">Sources</div>
            <ol className="list-decimal ml-4">
                {groundingChunks.map((chunk, i) => (
                    <li key={i}>
                        {chunk.web?.uri ? (
                            <LinkPreviewTooltip href={chunk.web.uri}>
                                {chunk.web.title || chunk.web.uri}
                            </LinkPreviewTooltip>
                        ) : (
                            <span>{chunk.web?.uri}</span>
                        )}
                    </li>
                ))}
            </ol>
        </div>
    );
}
