import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import ModelsList from "./ModelsList";
import ModelParameters from "./ModelParameters";
import { useState } from "react";
import { getProviderIconSvg } from "@/utils/providerIcon";



export default function ModelPicker({
    models,
    selectedModel,
    setSelectedModel,
    open,
    setOpen,
    handleToggleFavorite
}: {
    models: any[];
    selectedModel: any;
    setSelectedModel: (model: any) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
    handleToggleFavorite: () => void;
}) {
    const [parametersOpen, setParametersOpen] = useState(false);
    const isMobile = useIsMobile();

    const triggerButton = (
        <Button
            variant="outline"
            className="model-select-btn"
            aria-label="Select model"
        >
            {selectedModel ? (
                <div className="truncate flex items-center min-w-0 w-full">
                    <div className="flex-shrink-0">
                        {getProviderIconSvg(selectedModel?.id ?? "")}
                    </div>
                    <div className="ml-2 truncate min-w-0 flex-1">
                        <span className="block truncate text-sm">
                            {selectedModel.name || selectedModel.displayName || selectedModel.id}
                        </span>
                        {selectedModel.id && selectedModel.id !== (selectedModel.name || selectedModel.displayName) && (
                            <span className="block truncate text-xs text-muted-foreground">
                                {selectedModel.id}
                            </span>
                        )}
                    </div>
                </div>
            ) : (
                <span className="text-sm">+ Select model</span>
            )}
        </Button>
    );

    return (
        <div className="w-full flex flex-row items-center justify-between gap-2">
            {isMobile ? (
                <Drawer open={open} onOpenChange={setOpen}>
                    <DrawerTrigger asChild>
                        {triggerButton}
                    </DrawerTrigger>
                    <DrawerContent className="flex flex-col max-h-[80vh]" >
                        <DrawerHeader className="px-6 py-4 border-b flex-shrink-0">
                            <DrawerTitle className="text-lg font-semibold">Select Model</DrawerTitle>
                        </DrawerHeader>
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            <ModelsList
                                models={models}
                                setSelectedModel={setSelectedModel}
                                setOpen={setOpen}
                                isMobile={true}
                            />
                        </div>
                    </DrawerContent>
                </Drawer >
            ) : (
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        {triggerButton}
                    </PopoverTrigger>
                    <PopoverContent
                        className="model-picker-popover p-0 w-[90vw] max-w-4xl h-[80vh] max-h-[80vh] border shadow-lg z-50 !bg-background flex flex-col"
                        side="top"
                        align="center"
                    >
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            <ModelsList
                                models={models}
                                setSelectedModel={setSelectedModel}
                                setOpen={setOpen}
                                isMobile={false}
                            />
                        </div>
                    </PopoverContent>
                </Popover>
            )
            }

            <div className="flex items-center gap-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95"
                    disabled={!selectedModel}
                    onClick={() => setParametersOpen(true)}
                    title="Configure model parameters"
                    aria-label="Configure model parameters"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="star-btn h-10 w-10 rounded-full motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95"
                    disabled={!selectedModel}
                    onClick={handleToggleFavorite}
                    title="Toggle favorite"
                    aria-label="Toggle favorite model"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-6 text-yellow-500"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                        />
                    </svg>
                </Button>
            </div>

            <ModelParameters
                open={parametersOpen}
                onOpenChange={setParametersOpen}
                selectedModel={selectedModel}
            />
        </div >
    );
}
