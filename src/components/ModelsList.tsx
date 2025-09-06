import { useEffect, useState } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Brain, Star, StarOff, Search, X, Info } from "lucide-react";
import { getFavoriteModels, saveFavoriteModel, removeFavoriteModel } from "@/utils/store";
import { OpenRouterModel, GeminiModel } from "@/utils/state";
import { getProviderIconSvg } from "@/utils/providerIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import ModelDetails from "@/components/ModelDetails";

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
    const [filter, setFilter] = useState<"favorites" | "all" | "openrouter" | "gemini">("favorites");
    const [searchValue, setSearchValue] = useState("");
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [favoriteModelIds, setFavoriteModelIds] = useState<string[]>([]);
    const [detailsModel, setDetailsModel] = useState<OpenRouterModel | GeminiModel | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const deviceIsMobile = useIsMobile();

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
        switch (filter) {
            case "favorites":
                return favoriteModelIds.includes((model as any).id);
            case "openrouter":
                return (model as any)?.provider === "OpenRouter";
            case "gemini":
                return (model as any)?.provider === "Gemini";
            case "all":
            default:
                return true;
        }
    });

    filteredModels.sort((a, b) => {
        const aIsFavorite = favoriteModelIds.includes((a as any).id);
        const bIsFavorite = favoriteModelIds.includes((b as any).id);

        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        const pa = (a as any)?.provider;
        const pb = (b as any)?.provider;
        if (pa === pb) return 0;
        if (pa === "OpenRouter") return -1;
        return 1;
    });

    const openRouterCount = models.filter((m) => (m as any)?.provider === "OpenRouter").length;
    const geminiCount = models.filter((m) => (m as any)?.provider === "Gemini").length;
    const favoriteCount = favoriteModelIds.length;

    // Calculate counts based on current filter
    const getFilterCount = (filterType: typeof filter) => {
        switch (filterType) {
            case "favorites":
                return favoriteCount;
            case "openrouter":
                return openRouterCount;
            case "gemini":
                return geminiCount;
            case "all":
            default:
                return openRouterCount + geminiCount;
        }
    };

    return (
        <div role="listbox" aria-label="Model picker" className={`models-list h-full flex flex-col ${isMobile ? 'px-4' : 'p-4'}`}>
            <div className={`${isMobile ? 'mb-2' : 'mb-2'} relative overflow-hidden flex-shrink-0`}>
                <div className={`flex items-center gap-2 motion-safe:transition-all motion-safe:duration-300 ${isSearchExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <div className="flex-1">
                        <Select value={filter} onValueChange={(value) => setFilter(value as "favorites" | "all" | "openrouter" | "gemini")}>
                            <SelectTrigger className={`filter-select ${isMobile ? 'h-12 text-base' : 'h-10 text-sm'} min-h-[44px]`}>
                                <SelectValue aria-label="Filter models">
                                    {filter === "favorites" && `Favorites (${getFilterCount("favorites")})`}
                                    {filter === "all" && `All Models (${getFilterCount("all")})`}
                                    {filter === "openrouter" && `OpenRouter (${getFilterCount("openrouter")})`}
                                    {filter === "gemini" && `Gemini (${getFilterCount("gemini")})`}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="favorites">Favorites ({getFilterCount("favorites")})</SelectItem>
                                <SelectItem value="all">All Models ({getFilterCount("all")})</SelectItem>
                                <SelectItem value="openrouter">OpenRouter ({getFilterCount("openrouter")})</SelectItem>
                                <SelectItem value="gemini">Gemini ({getFilterCount("gemini")})</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className={`${isMobile ? 'h-12 w-12' : 'h-10 w-10'} rounded-full motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95 min-h-[44px] min-w-[44px]`}
                        onClick={() => setIsSearchExpanded(true)}
                        title="Search models"
                        aria-label="Search models"
                    >
                        <Search className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
                    </Button>
                </div>

                {/* Full Width Search Bar */}
                <div className={`absolute inset-0 flex items-center motion-safe:transition-all motion-safe:duration-300 ${isSearchExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                    <div className="w-full bg-background border rounded-md px-3 py-2 flex items-center gap-3 shadow-md">
                        <Search className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} text-muted-foreground flex-shrink-0`} />
                        <input
                            type="text"
                            className={`flex-1 bg-transparent outline-none ${isMobile ? 'text-base' : 'text-sm'} placeholder:text-muted-foreground/70`}
                            placeholder="Search models..."
                            aria-label="Search models"
                            value={searchValue}
                            onChange={e => setSearchValue(e.target.value)}
                            onBlur={() => {
                                if (!searchValue.trim()) {
                                    setIsSearchExpanded(false);
                                }
                            }}
                            autoFocus={isSearchExpanded}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setSearchValue("");
                                    setIsSearchExpanded(false);
                                }
                            }}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`p-0 ${isMobile ? 'h-8 w-8' : 'h-6 w-6'} rounded-full hover:bg-accent/20 flex-shrink-0`}
                            onClick={() => {
                                setSearchValue("");
                                setIsSearchExpanded(false);
                            }}
                            title="Close search"
                            aria-label="Close search"
                        >
                            <X className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                        </Button>
                    </div>
                </div>
            </div>
            <div className="model-list-container flex-1 min-h-0 overflow-y-auto">
                <div className={`${isMobile
                    ? 'grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 pb-6 px-2'
                    : 'grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4'
                    } content-start`}>
                    {filteredModels.length === 0 ? (
                        filter === "favorites" && favoriteCount === 0 ? (
                            <div className="col-span-full text-center py-8">
                                <Star className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground mb-4">No favorite models yet</p>
                                <Button
                                    variant="outline"
                                    onClick={() => setFilter("all")}
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

                                const handleDetailsClick = (e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    if (deviceIsMobile || isMobile) {
                                        setDetailsModel(model);
                                        setIsDetailsOpen(true);
                                    }
                                };

                                const ModelCard = (
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
                                        {/* Details Button */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`absolute top-3 right-3 ${isMobile ? 'w-10 h-10' : 'w-8 h-8'
                                                } p-0 rounded-full hover:bg-accent/20 min-h-[44px] min-w-[44px] opacity-70 hover:opacity-100`}
                                            onClick={handleDetailsClick}
                                            title="View model details"
                                        >
                                            <Info className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-muted-foreground`} />
                                        </Button>

                                        {/* Favorite Star Button */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`absolute top-3 ${isMobile ? 'right-14' : 'right-11'} ${isMobile ? 'w-10 h-10' : 'w-8 h-8'
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

                                // For desktop, wrap the card in a popover
                                if (!deviceIsMobile && !isMobile) {
                                    return (
                                        <Popover key={name}>
                                            <PopoverTrigger asChild>
                                                {ModelCard}
                                            </PopoverTrigger>
                                            <PopoverContent
                                                side="right"
                                                align="start"
                                                className="w-80 max-h-96 overflow-y-auto"
                                                sideOffset={10}
                                            >
                                                <ModelDetails model={model} isMobile={false} />
                                            </PopoverContent>
                                        </Popover>
                                    );
                                }

                                // For mobile, just return the card (dialog handled separately)
                                return ModelCard;
                            })
                    )}
                </div>
            </div>

            {/* Mobile Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-[95vw] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Model Details</DialogTitle>
                    </DialogHeader>
                    {detailsModel && (
                        <ModelDetails model={detailsModel} isMobile={true} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
