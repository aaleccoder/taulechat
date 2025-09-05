
interface UsageMetadata {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
    cachedContentTokenCount: number;
    promptTokensDetails?: { modality: string; tokenCount: number }[];
}

export default function UsageMetadataDisplay({ usageMetadata }: { usageMetadata: UsageMetadata }) {
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
            aria-label="Token usage details"
            role="contentinfo"
        >
            <div className="font-semibold text-foreground mb-1">Token Usage</div>
            <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-muted px-2 py-1" title="Prompt tokens">
                    Prompt: <span className="font-mono">{usageMetadata.promptTokenCount}</span>
                </span>
                <span className="rounded-full bg-muted px-2 py-1" title="Candidates tokens">
                    Candidates: <span className="font-mono">{usageMetadata.candidatesTokenCount}</span>
                </span>
                <span className="rounded-full bg-muted px-2 py-1" title="Total tokens">
                    Total: <span className="font-mono">{usageMetadata.totalTokenCount}</span>
                </span>
                <span className="rounded-full bg-muted px-2 py-1" title="Cached content tokens">
                    Cached: <span className="font-mono">{usageMetadata.cachedContentTokenCount}</span>
                </span>
            </div>
            {usageMetadata.promptTokensDetails && (
                <div className="mt-1">
                    <span className="font-semibold">Prompt Details:</span>
                    <ul className="list-disc ml-4">
                        {usageMetadata.promptTokensDetails.map((detail, i) => (
                            <li key={i}>
                                <span className="font-mono">{detail.modality}</span>: <span className="font-mono">{detail.tokenCount}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
