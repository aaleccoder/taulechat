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
    handleToggleFavorite: _handleToggleFavorite
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
            size={"sm"}
            className="chat-input-buttons"
            aria-label="Select model"
        >
            {selectedModel ? (
                <div className="truncate flex items-center min-w-0 w-full">
                    <div className="flex-shrink-0">
                        {getProviderIconSvg(selectedModel?.id ?? "")}
                    </div>
                    <div className="ml-2 truncate min-w-0 flex-1">
                        <span className="block truncate text-xs">
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
        <>
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
            )}

            <ModelParameters
                open={parametersOpen}
                onOpenChange={setParametersOpen}
                selectedModel={selectedModel}
            />
        </>
    );
}
