import React, { useEffect, useState } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { getDefaultModel } from "@/utils/store";
import { OpenRouterModel, GeminiModel } from "@/utils/state";

export default function ModelsList({
    models,
    setSelectedModel,
    setOpen
}: {
    models: (OpenRouterModel | GeminiModel)[];
    setSelectedModel: (model: OpenRouterModel | GeminiModel) => void;
    setOpen: (open: boolean) => void;
}) {
    const [providerFilter, setProviderFilter] = useState<"all" | "OpenRouter" | "Gemini">("all");
    const [searchValue, setSearchValue] = useState("");
    const filteredModels = models.filter((model) => {
        if (providerFilter === "all") return true;
        return (model as any)?.provider === providerFilter;
    });
    filteredModels.sort((a, b) => {
        const pa = (a as any)?.provider;
        const pb = (b as any)?.provider;
        if (pa === pb) return 0;
        if (pa === "OpenRouter") return -1;
        return 1;
    });
    const openRouterCount = models.filter((m) => (m as any)?.provider === "OpenRouter").length;
    const geminiCount = models.filter((m) => (m as any)?.provider === "Gemini").length;
    const [defaultModel, setDefaultModel] = useState<string | undefined>(undefined);

    useEffect(() => {
        const loadDefaultModel = async () => {
            console.log(defaultModel)
            setDefaultModel(await getDefaultModel());
        };
        loadDefaultModel();
    }, []);

    return (
        <div role="listbox" aria-label="Model picker" className="models-list">
            <div className="search-input-wrapper">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search model..."
                    aria-label="Search model"
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                />
            </div>
            <div className="filter-select-wrapper">
                <Select value={providerFilter} onValueChange={v => setProviderFilter(v as any)}>
                    <SelectTrigger className="filter-select">
                        <SelectValue aria-label="Filter by provider">
                            {providerFilter === "all"
                                ? `All (${openRouterCount + geminiCount})`
                                : providerFilter === "OpenRouter"
                                    ? `OpenRouter (${openRouterCount})`
                                    : `Gemini (${geminiCount})`}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All ({openRouterCount + geminiCount})</SelectItem>
                        <SelectItem value="OpenRouter">OpenRouter ({openRouterCount})</SelectItem>
                        <SelectItem value="Gemini">Gemini ({geminiCount})</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="model-list-container">
                {filteredModels.length === 0 ? (
                    <div className="no-models">No model found.</div>
                ) : (
                    <div className="inner-model-list">
                        {(() => {
                            let lastProvider: string | null = null;
                            return filteredModels
                                .filter((model) => {
                                    const name = (model as any).name || (model as any).displayName || (model as any).id;
                                    return name?.toLowerCase().includes(searchValue.toLowerCase());
                                })
                                .map((model) => {
                                    const provider = (model as any)?.provider;
                                    const name = (model as any).name || (model as any).displayName || (model as any).id;
                                    const supportsImageInput = provider === "OpenRouter" && Array.isArray((model as any)?.architecture?.input_modalities) && (model as any).architecture.input_modalities.includes("image");
                                    const supportsImageOutput = provider === "OpenRouter" && Array.isArray((model as any)?.architecture?.output_modalities) && (model as any).architecture.output_modalities.includes("image");
                                    const showLabel = provider !== lastProvider;
                                    lastProvider = provider;
                                    return (
                                        <React.Fragment key={name}>
                                            {showLabel && (
                                                <div className={
                                                    provider === "OpenRouter"
                                                        ? "provider-label-openrouter"
                                                        : "provider-label-gemini"
                                                }>
                                                    {provider}
                                                </div>
                                            )}
                                            <div
                                                role="option"
                                                aria-selected={false}
                                                tabIndex={0}
                                                className="model-pill model-pill-default"
                                                onClick={() => { setOpen(false); setSelectedModel(model); }}
                                                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { setOpen(false); setSelectedModel(model); } }}
                                            >
                                                <span className="model-name">{name}</span>
                                                {supportsImageInput && (
                                                    <span className="image-badge" title="Supports image input">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-blue-500"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" /><circle cx="8.5" cy="13.5" r="2.5" stroke="currentColor" strokeWidth="2" /><path d="M21 19l-5-6-4 5-3-4-4 5" stroke="currentColor" strokeWidth="2" /></svg>
                                                    </span>
                                                )}
                                                {supportsImageOutput && (
                                                    <span className="image-badge" title="Supports image output">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-green-500"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" /><circle cx="15.5" cy="13.5" r="2.5" stroke="currentColor" strokeWidth="2" /><path d="M3 19l5-6 4 5 3-4 4 5" stroke="currentColor" strokeWidth="2" /></svg>
                                                    </span>
                                                )}
                                            </div>
                                        </React.Fragment>
                                    );
                                });
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}
