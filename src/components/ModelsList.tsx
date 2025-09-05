import { useEffect, useState } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Star, StarOff } from "lucide-react";
import { getFavoriteModels, saveFavoriteModel, removeFavoriteModel } from "@/utils/store";
import { OpenRouterModel, GeminiModel } from "@/utils/state";
import { getProviderIconSvg } from "@/utils/providerIcon";

export default function ModelsList({
    models,
    setSelectedModel,
    setOpen,
    isMobile = false
}: {
    models: (OpenRouterModel | GeminiModel)[];
    setSelectedModel: (model: OpenRouterModel | GeminiModel) => void;
    setOpen: (open: boolean) => void;
    isMobile?: boolean;
}) {
    const [providerFilter, setProviderFilter] = useState<"all" | "OpenRouter" | "Gemini">("all");
    const [searchValue, setSearchValue] = useState("");
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(true);
    const [favoriteModelIds, setFavoriteModelIds] = useState<string[]>([]);

    useEffect(() => {
        const loadFavorites = async () => {
            const favorites = await getFavoriteModels();
            setFavoriteModelIds(favorites);
        };
        loadFavorites();
    }, []);

    const toggleFavorite = async (modelId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card selection
        const isFavorite = favoriteModelIds.includes(modelId);

        if (isFavorite) {
            await removeFavoriteModel(modelId);
            setFavoriteModelIds(prev => prev.filter(id => id !== modelId));
        } else {
            await saveFavoriteModel(modelId);
            setFavoriteModelIds(prev => [...prev, modelId]);
        }
    };

    let filteredModels = models.filter((model) => {
        if (providerFilter === "all") return true;
        return (model as any)?.provider === providerFilter;
    });

    // Filter by favorites if showFavoritesOnly is true
    if (showFavoritesOnly) {
        filteredModels = filteredModels.filter((model) =>
            favoriteModelIds.includes((model as any).id)
        );
    }

    filteredModels.sort((a, b) => {
        // Sort favorites first
        const aIsFavorite = favoriteModelIds.includes((a as any).id);
        const bIsFavorite = favoriteModelIds.includes((b as any).id);

        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;

        // Then by provider
        const pa = (a as any)?.provider;
        const pb = (b as any)?.provider;
        if (pa === pb) return 0;
        if (pa === "OpenRouter") return -1;
        return 1;
    });

    const openRouterCount = models.filter((m) => (m as any)?.provider === "OpenRouter").length;
    const geminiCount = models.filter((m) => (m as any)?.provider === "Gemini").length;
    const favoriteCount = favoriteModelIds.length;

    // When showing favorites, calculate counts based on favorites only
    const openRouterFavoriteCount = showFavoritesOnly
        ? models.filter((m) => (m as any)?.provider === "OpenRouter" && favoriteModelIds.includes((m as any).id)).length
        : openRouterCount;
    const geminiFavoriteCount = showFavoritesOnly
        ? models.filter((m) => (m as any)?.provider === "Gemini" && favoriteModelIds.includes((m as any).id)).length
        : geminiCount;
    const totalCountToShow = showFavoritesOnly ? favoriteCount : (openRouterCount + geminiCount);

    return (
        <div role="listbox" aria-label="Model picker" className={`models-list ${isMobile ? 'px-6 py-4' : 'p-4'}`}>
            {/* Favorites/All Models Toggle */}
            <div className={`${isMobile ? 'mb-6' : 'mb-4'} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <Button
                        variant={showFavoritesOnly ? "default" : "outline"}
                        size={isMobile ? "default" : "sm"}
                        onClick={() => setShowFavoritesOnly(true)}
                        className={`${isMobile ? 'text-sm px-4 py-2 h-12' : 'text-xs'} min-h-[44px] min-w-[44px]`}
                    >
                        <Star className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
                        Favorites ({favoriteCount})
                    </Button>
                    <Button
                        variant={!showFavoritesOnly ? "default" : "outline"}
                        size={isMobile ? "default" : "sm"}
                        onClick={() => setShowFavoritesOnly(false)}
                        className={`${isMobile ? 'text-sm px-4 py-2 h-12' : 'text-xs'} min-h-[44px] min-w-[44px]`}
                    >
                        All Models ({openRouterCount + geminiCount})
                    </Button>
                </div>
            </div>

            <div className={`search-input-wrapper ${isMobile ? 'mb-6' : 'mb-4'}`}>
                <input
                    type="text"
                    className={`search-input w-full px-4 py-3 border border-border rounded-md bg-background ${isMobile ? 'text-base h-12' : 'text-sm h-10'} min-h-[44px]`}
                    placeholder="Search model..."
                    aria-label="Search model"
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                />
            </div>
            <div className={`filter-select-wrapper ${isMobile ? 'mb-6' : 'mb-4'}`}>
                <Select value={providerFilter} onValueChange={v => setProviderFilter(v as any)}>
                    <SelectTrigger className={`filter-select ${isMobile ? 'h-12 text-base' : 'h-10 text-sm'} min-h-[44px]`}>
                        <SelectValue aria-label="Filter by provider">
                            {providerFilter === "all"
                                ? `All (${totalCountToShow})`
                                : providerFilter === "OpenRouter"
                                    ? `OpenRouter (${openRouterFavoriteCount})`
                                    : `Gemini (${geminiFavoriteCount})`}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All ({totalCountToShow})</SelectItem>
                        <SelectItem value="OpenRouter">OpenRouter ({openRouterFavoriteCount})</SelectItem>
                        <SelectItem value="Gemini">Gemini ({geminiFavoriteCount})</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className={`model-list-container ${isMobile
                ? 'grid grid-cols-1 gap-4 pb-6'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                } ${isMobile ? 'max-h-[calc(85vh-280px)] overflow-y-auto' : ''}`}>
                {filteredModels.length === 0 ? (
                    showFavoritesOnly && favoriteCount === 0 ? (
                        <div className="col-span-full text-center py-8">
                            <Star className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground mb-4">No favorite models yet</p>
                            <Button
                                variant="outline"
                                onClick={() => setShowFavoritesOnly(false)}
                                className="text-sm"
                            >
                                Browse All Models
                            </Button>
                        </div>
                    ) : (
                        <div className="col-span-full text-center py-4 text-muted-foreground">No models found.</div>
                    )
                ) : (
                    filteredModels
                        .filter((model) => {
                            const name = (model as any).name || (model as any).displayName || (model as any).id;
                            return name?.toLowerCase().includes(searchValue.toLowerCase());
                        })
                        .map((model) => {
                            const provider = (model as any)?.provider;
                            const name = (model as any).name || (model as any).displayName || (model as any).id;
                            const supportsImageInput = provider === "OpenRouter" && Array.isArray((model as any)?.architecture?.input_modalities) && (model as any).architecture.input_modalities.includes("image");
                            const supportsImageOutput = provider === "OpenRouter" && Array.isArray((model as any)?.architecture?.output_modalities) && (model as any).architecture.output_modalities.includes("image");
                            const supportsReasoning = provider === "OpenRouter" && Array.isArray((model as any)?.supported_parameters) && (model as any).supported_parameters.includes("reasoning");
                            const isThinkingModel = provider === "Gemini" && (model as any)?.thinking === true;


                            const modelId = (model as any).id;
                            const isFavorite = favoriteModelIds.includes(modelId);

                            return (
                                <Card
                                    key={name}
                                    role="option"
                                    aria-selected={false}
                                    tabIndex={0}
                                    className={`model-card border bg-card shadow-md rounded-xl ${isMobile
                                        ? 'px-6 py-6 min-h-[140px]'
                                        : 'px-4 py-4 min-h-[120px]'
                                        } flex flex-col items-center gap-3 cursor-pointer motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95 relative`}
                                    onClick={() => { setOpen(false); setSelectedModel(model); }}
                                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { setOpen(false); setSelectedModel(model); } }}
                                >
                                    {/* Favorite Star Button */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`absolute top-3 right-3 ${isMobile ? 'w-10 h-10' : 'w-8 h-8'
                                            } p-0 rounded-full hover:bg-accent/20 min-h-[44px] min-w-[44px]`}
                                        onClick={(e) => toggleFavorite(modelId, e)}
                                        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                                    >
                                        {isFavorite ? (
                                            <Star className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-yellow-500 fill-yellow-500`} />
                                        ) : (
                                            <StarOff className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-muted-foreground`} />
                                        )}
                                    </Button>

                                    {getProviderIconSvg(modelId)}

                                    <div className="flex flex-col items-center gap-2 text-center w-full">
                                        <span className={`model-name font-semibold ${isMobile ? 'text-base' : 'text-sm'
                                            } text-foreground line-clamp-2 break-words overflow-hidden text-ellipsis w-full px-2`}>
                                            {name}
                                        </span>
                                        <span className={`${isMobile ? 'text-sm' : 'text-xs'
                                            } text-muted-foreground truncate w-full`}>
                                            {provider}
                                        </span>
                                    </div>

                                    <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-2'}`}>
                                        {(supportsReasoning || isThinkingModel) && (
                                            <span className={`reasoning-badge ${isMobile ? 'w-10 h-10' : 'w-8 h-8'
                                                } rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center min-h-[44px] min-w-[44px]`} title="Supports reasoning/thinking">
                                                <Brain className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} text-purple-600 dark:text-purple-400`} />
                                            </span>
                                        )}
                                        {supportsImageInput && (
                                            <span className={`image-badge ${isMobile ? 'w-10 h-10' : 'w-8 h-8'
                                                } rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center min-h-[44px] min-w-[44px]`} title="Supports image input">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} text-blue-600 dark:text-blue-400`}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                                </svg>
                                            </span>
                                        )}
                                        {supportsImageOutput && (
                                            <span className={`image-badge ${isMobile ? 'w-10 h-10' : 'w-8 h-8'
                                                } rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center min-h-[44px] min-w-[44px]`} title="Supports image output">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} text-green-600 dark:text-green-400 scale-x-[-1]`}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                                </svg>
                                            </span>
                                        )}
                                    </div>
                                </Card>
                            );
                        })
                )}
            </div>
        </div>
    );
}
