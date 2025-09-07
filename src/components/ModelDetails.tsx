import { OpenRouterModel, GeminiModel } from "@/utils/state";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Image, Zap, Clock, DollarSign, Server, Info, FileText } from "lucide-react";

interface ModelDetailsProps {
    model: OpenRouterModel | GeminiModel;
    isMobile?: boolean;
}

export default function ModelDetails({ model, isMobile = false }: ModelDetailsProps) {
    const provider = (model as any)?.provider;
    const name = (model as any).name || (model as any).displayName || (model as any).id;

    const isOpenRouter = provider === "OpenRouter";
    const openRouterModel = model as OpenRouterModel;

    const isGemini = provider === "Gemini";
    const geminiModel = model as GeminiModel;

    const supportsImageInput = isOpenRouter && Array.isArray(openRouterModel?.architecture?.input_modalities) && openRouterModel.architecture.input_modalities.includes("image");
    const supportsImageOutput = isOpenRouter && Array.isArray(openRouterModel?.architecture?.output_modalities) && openRouterModel.architecture.output_modalities.includes("image");
    const supportsReasoning = isOpenRouter && Array.isArray(openRouterModel?.supported_parameters) && openRouterModel.supported_parameters.includes("reasoning");
    const isThinkingModel = isGemini && geminiModel?.thinking === true;

    const supportsPdfInput = isOpenRouter || isGemini;

    const formatTokenCount = (count: number) => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(0)}K`;
        }
        return count.toString();
    };

    const formatPrice = (price: string | number) => {
        if (typeof price === 'string') {
            const numPrice = parseFloat(price);
            return `$${numPrice.toFixed(6)}`;
        }
        return `$${price.toFixed(6)}`;
    };

    return (
        <div className={`model-details-content ${isMobile ? 'space-y-4' : 'space-y-3'} max-w-md`}>
            {/* Header */}
            <div className="space-y-2">
                <h3 className={`font-semibold ${isMobile ? 'text-lg' : 'text-base'} leading-tight`}>
                    {name}
                </h3>
                <Badge variant="secondary" className="text-xs">
                    {provider}
                </Badge>
            </div>

            {/* Description */}
            {((isOpenRouter && openRouterModel.description) || (isGemini && geminiModel.description)) && (
                <>
                    <Separator />
                    <div>
                        <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground leading-relaxed`}>
                            {isOpenRouter ? openRouterModel.description : geminiModel.description}
                        </p>
                    </div>
                </>
            )}

            <Separator />
            <div>
                <h4 className={`${isMobile ? 'text-sm' : 'text-xs'} font-medium mb-2 flex items-center gap-2`}>
                    <Zap className="w-4 h-4" />
                    Capabilities
                </h4>
                <div className="flex flex-wrap gap-2">
                    {(supportsReasoning || isThinkingModel) && (
                        <Badge variant="outline" className="text-xs">
                            <Brain className="w-3 h-3 mr-1" />
                            Reasoning
                        </Badge>
                    )}
                    {supportsImageInput && (
                        <Badge variant="outline" className="text-xs">
                            <Image className="w-3 h-3 mr-1" />
                            Image Input
                        </Badge>
                    )}
                    {supportsImageOutput && (
                        <Badge variant="outline" className="text-xs">
                            <Image className="w-3 h-3 mr-1" />
                            Image Output
                        </Badge>
                    )}
                    {supportsPdfInput && (
                        <Badge variant="outline" className="text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            PDF Input
                        </Badge>
                    )}
                </div>
            </div>

            {/* Context & Tokens */}
            <Separator />
            <div>
                <h4 className={`${isMobile ? 'text-sm' : 'text-xs'} font-medium mb-2 flex items-center gap-2`}>
                    <Clock className="w-4 h-4" />
                    Context & Tokens
                </h4>
                <div className="space-y-1">
                    {isOpenRouter && openRouterModel.context_length && (
                        <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                            Context Length: <span className="font-mono">{formatTokenCount(openRouterModel.context_length)}</span>
                        </div>
                    )}
                    {isOpenRouter && openRouterModel.top_provider?.max_completion_tokens && (
                        <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                            Max Completion: <span className="font-mono">{formatTokenCount(openRouterModel.top_provider.max_completion_tokens)}</span>
                        </div>
                    )}
                    {isGemini && geminiModel.inputTokenLimit && (
                        <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                            Input Limit: <span className="font-mono">{formatTokenCount(geminiModel.inputTokenLimit)}</span>
                        </div>
                    )}
                    {isGemini && geminiModel.outputTokenLimit && (
                        <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                            Output Limit: <span className="font-mono">{formatTokenCount(geminiModel.outputTokenLimit)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Pricing (OpenRouter only) */}
            {isOpenRouter && openRouterModel.pricing && (
                <>
                    <Separator />
                    <div>
                        <h4 className={`${isMobile ? 'text-sm' : 'text-xs'} font-medium mb-2 flex items-center gap-2`}>
                            <DollarSign className="w-4 h-4" />
                            Pricing (per token)
                        </h4>
                        <div className="space-y-1">
                            {openRouterModel.pricing.prompt && (
                                <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                                    Input: <span className="font-mono">{formatPrice(openRouterModel.pricing.prompt)}</span>
                                </div>
                            )}
                            {openRouterModel.pricing.completion && (
                                <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                                    Output: <span className="font-mono">{formatPrice(openRouterModel.pricing.completion)}</span>
                                </div>
                            )}
                            {openRouterModel.pricing.image && (
                                <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                                    Image: <span className="font-mono">{formatPrice(openRouterModel.pricing.image)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Technical Details */}
            <Separator />
            <div>
                <h4 className={`${isMobile ? 'text-sm' : 'text-xs'} font-medium mb-2 flex items-center gap-2`}>
                    <Server className="w-4 h-4" />
                    Technical Details
                </h4>
                <div className="space-y-1">
                    <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                        Model ID: <span className="font-mono">{(model as any).id}</span>
                    </div>

                    {isOpenRouter && openRouterModel.architecture?.tokenizer && (
                        <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                            Tokenizer: <span className="font-mono">{openRouterModel.architecture.tokenizer}</span>
                        </div>
                    )}

                    {isOpenRouter && openRouterModel.architecture?.instruct_type && (
                        <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                            Instruct Type: <span className="font-mono">{openRouterModel.architecture.instruct_type}</span>
                        </div>
                    )}

                    {isGemini && geminiModel.version && (
                        <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                            Version: <span className="font-mono">{geminiModel.version}</span>
                        </div>
                    )}

                    {isGemini && geminiModel.supportedGenerationMethods && (
                        <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                            Generation Methods:
                            <div className="mt-1">
                                {geminiModel.supportedGenerationMethods.map((method, index) => (
                                    <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                                        {method}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Default Parameters (Gemini only) */}
            {isGemini && (
                <>
                    <Separator />
                    <div>
                        <h4 className={`${isMobile ? 'text-sm' : 'text-xs'} font-medium mb-2 flex items-center gap-2`}>
                            <Info className="w-4 h-4" />
                            Default Parameters
                        </h4>
                        <div className="space-y-1">
                            {geminiModel.temperature !== undefined && (
                                <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                                    Temperature: <span className="font-mono">{geminiModel.temperature}</span>
                                </div>
                            )}
                            {geminiModel.maxTemperature !== undefined && (
                                <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                                    Max Temperature: <span className="font-mono">{geminiModel.maxTemperature}</span>
                                </div>
                            )}
                            {geminiModel.topK !== undefined && (
                                <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                                    Top K: <span className="font-mono">{geminiModel.topK}</span>
                                </div>
                            )}
                            {geminiModel.topP !== undefined && (
                                <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                                    Top P: <span className="font-mono">{geminiModel.topP}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
