import {
    MessageSquare,
    Zap,
    Hash,
    Database,
    Brain,
    Image,
    Volume2,
    DollarSign,
    ArrowUp,
    FileText,
    Activity
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { useState } from "react";

interface GeminiUsageMetadata {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
    cachedContentTokenCount: number;
    thoughtsTokenCount?: number;
    promptTokensDetails?: { modality: string; tokenCount: number }[];
}

interface OpenRouterUsageMetadata {
    promptTokenCount: number;
    completionTokenCount: number;
    totalTokenCount: number;
    reasoningTokenCount?: number;
    imageTokenCount?: number;
    cachedTokenCount?: number;
    audioTokenCount?: number;
    cost?: number;
    upstreamCost?: number;
    upstreamPromptCost?: number;
    upstreamCompletionsCost?: number;
    isByok?: boolean;
}

type UsageMetadata = GeminiUsageMetadata | OpenRouterUsageMetadata;

function isOpenRouterMetadata(metadata: UsageMetadata): metadata is OpenRouterUsageMetadata {
    return 'completionTokenCount' in metadata;
}

export default function UsageMetadataDisplay({ usageMetadata }: { usageMetadata: UsageMetadata }) {
    const isOpenRouter = isOpenRouterMetadata(usageMetadata);
    const isMobile = useIsMobile();
    const [open, setOpen] = useState(false);

    const UsageDetails = (
        <div className="space-y-3 text-sm">
            <div className="font-semibold text-foreground">Token Usage Details</div>
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    <span>Prompt: <span className="font-mono text-foreground">{usageMetadata.promptTokenCount}</span></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    <span>{isOpenRouter ? "Completion" : "Candidates"}: <span className="font-mono text-foreground">{isOpenRouter ? usageMetadata.completionTokenCount : (usageMetadata as GeminiUsageMetadata).candidatesTokenCount}</span></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    <span>Total: <span className="font-mono text-foreground">{usageMetadata.totalTokenCount}</span></span>
                </div>
                {isOpenRouter ? (
                    <>
                        {usageMetadata.reasoningTokenCount !== undefined && usageMetadata.reasoningTokenCount > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Brain className="h-3 w-3" />
                                <span>Reasoning: <span className="font-mono text-foreground">{usageMetadata.reasoningTokenCount}</span></span>
                            </div>
                        )}
                        {usageMetadata.imageTokenCount !== undefined && usageMetadata.imageTokenCount > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Image className="h-3 w-3" />
                                <span>Image: <span className="font-mono text-foreground">{usageMetadata.imageTokenCount}</span></span>
                            </div>
                        )}
                        {usageMetadata.cachedTokenCount !== undefined && usageMetadata.cachedTokenCount > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Database className="h-3 w-3" />
                                <span>Cached: <span className="font-mono text-foreground">{usageMetadata.cachedTokenCount}</span></span>
                            </div>
                        )}
                        {usageMetadata.audioTokenCount !== undefined && usageMetadata.audioTokenCount > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Volume2 className="h-3 w-3" />
                                <span>Audio: <span className="font-mono text-foreground">{usageMetadata.audioTokenCount}</span></span>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Database className="h-3 w-3" />
                            <span>Cached: <span className="font-mono text-foreground">{(usageMetadata as GeminiUsageMetadata).cachedContentTokenCount}</span></span>
                        </div>
                        {(usageMetadata as GeminiUsageMetadata).thoughtsTokenCount !== undefined && (usageMetadata as GeminiUsageMetadata).thoughtsTokenCount! > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Brain className="h-3 w-3" />
                                <span>Thoughts: <span className="font-mono text-foreground">{(usageMetadata as GeminiUsageMetadata).thoughtsTokenCount}</span></span>
                            </div>
                        )}
                    </>
                )}
            </div>
            {isOpenRouter && (usageMetadata.cost !== undefined || usageMetadata.upstreamCost !== undefined || usageMetadata.upstreamPromptCost !== undefined || usageMetadata.upstreamCompletionsCost !== undefined) && (
                <>
                    <Separator />
                    <div className="space-y-2">
                        <div className="font-semibold text-xs text-foreground">Cost Breakdown</div>
                        {usageMetadata.cost !== undefined && usageMetadata.cost > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                <span>Total: <span className="font-mono text-foreground">${usageMetadata.cost.toFixed(4)}</span></span>
                            </div>
                        )}
                        {usageMetadata.upstreamCost !== undefined && usageMetadata.upstreamCost > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ArrowUp className="h-3 w-3" />
                                <span>Upstream: <span className="font-mono text-foreground">${usageMetadata.upstreamCost.toFixed(4)}</span></span>
                            </div>
                        )}
                        {usageMetadata.upstreamPromptCost !== undefined && usageMetadata.upstreamPromptCost > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MessageSquare className="h-3 w-3" />
                                <span>Prompt Cost: <span className="font-mono text-foreground">${usageMetadata.upstreamPromptCost.toFixed(4)}</span></span>
                            </div>
                        )}
                        {usageMetadata.upstreamCompletionsCost !== undefined && usageMetadata.upstreamCompletionsCost > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Zap className="h-3 w-3" />
                                <span>Completion Cost: <span className="font-mono text-foreground">${usageMetadata.upstreamCompletionsCost.toFixed(4)}</span></span>
                            </div>
                        )}
                        {usageMetadata.isByok && (
                            <div className="text-xs text-muted-foreground">
                                🔑 Bring Your Own Key
                            </div>
                        )}
                    </div>
                </>
            )}
            {!isOpenRouter && (usageMetadata as GeminiUsageMetadata).promptTokensDetails && (
                <>
                    <Separator />
                    <div className="space-y-2">
                        <div className="font-semibold text-xs text-foreground">Prompt Details</div>
                        {(usageMetadata as GeminiUsageMetadata).promptTokensDetails!.map((detail, i) => (
                            <div key={i} className="flex items-center gap-2 text-muted-foreground">
                                <FileText className="h-3 w-3" />
                                <span>{detail.modality}: <span className="font-mono text-foreground">{detail.tokenCount}</span></span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                    <Badge
                        variant="muted"
                        className="mt-1 mb-1 px-2 py-1 gap-1 text-xs text-muted-foreground/80 bg-muted/20 border-muted/30 hover:bg-muted/30 hover:text-muted-foreground motion-safe:transition-all motion-safe:duration-200 cursor-pointer w-fit"
                        aria-label="Token usage details"
                        role="button"
                        tabIndex={0}
                    >
                        <Activity className="h-3 w-3 opacity-70" />
                        <span>{usageMetadata.totalTokenCount}</span>
                        {isOpenRouter && (usageMetadata.cost !== undefined && usageMetadata.cost > 0) && (
                            <>
                                <span className="text-muted-foreground/50">•</span>
                                <DollarSign className="h-3 w-3 opacity-70" />
                                <span>${usageMetadata.cost.toFixed(4)}</span>
                            </>
                        )}
                    </Badge>
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Token Usage Details</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-4">
                        {UsageDetails}
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <TooltipProvider>
            <Badge
                variant="muted"
                className="mt-1 mb-1 px-2 py-1 gap-1 text-xs text-muted-foreground/80 bg-muted/20 border-muted/30 hover:bg-muted/30 hover:text-muted-foreground motion-safe:transition-all motion-safe:duration-200 cursor-default w-fit"
                aria-label="Token usage details"
                role="contentinfo"
            >
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 gap-1 text-xs text-inherit hover:bg-transparent hover:text-inherit font-mono"
                        >
                            <Activity className="h-3 w-3 opacity-70" />
                            <span>{usageMetadata.totalTokenCount}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start" className="max-w-xs">
                        {UsageDetails}
                    </TooltipContent>
                </Tooltip>

                {isOpenRouter && (usageMetadata.cost !== undefined && usageMetadata.cost > 0) && (
                    <>
                        <span className="text-muted-foreground/50">•</span>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 gap-1 text-xs text-inherit hover:bg-transparent hover:text-inherit font-mono"
                                >
                                    <DollarSign className="h-3 w-3 opacity-70" />
                                    <span>${usageMetadata.cost.toFixed(4)}</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <span className="text-sm">Total cost for this request</span>
                            </TooltipContent>
                        </Tooltip>
                    </>
                )}
            </Badge>
        </TooltipProvider>
    );
}
