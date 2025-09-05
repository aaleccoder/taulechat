import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import ModelsList from "./ModelsList";

export default function ModelPicker({
    models,
    selectedModel,
    setSelectedModel,
    defaultModelId,
    open,
    setOpen,
    handleQuickSetDefault
}: {
    models: any[];
    selectedModel: any;
    setSelectedModel: (model: any) => void;
    defaultModelId: string | undefined;
    open: boolean;
    setOpen: (open: boolean) => void;
    handleQuickSetDefault: () => void;
}) {
    return (
        <div className="model-picker-row w-full">
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                    <Button
                        variant="outline"
                        className="model-select-btn"
                        aria-label="Select model"
                    >
                        {selectedModel ? (
                            <span className="truncate">
                                {selectedModel.name || selectedModel.displayName || selectedModel.id}
                            </span>
                        ) : (
                            <>+ Select model</>
                        )}
                    </Button>
                </DrawerTrigger>
                <DrawerContent className="w-full">
                    <ModelsList
                        models={models}
                        setSelectedModel={setSelectedModel}
                        setOpen={setOpen}
                    />
                </DrawerContent>
            </Drawer>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="star-btn"
                disabled={!selectedModel}
                onClick={handleQuickSetDefault}
                title={
                    selectedModel && selectedModel.id === defaultModelId
                        ? "Default model"
                        : "Set as default"
                }
                aria-label="Toggle default model"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className={`size-6 ${selectedModel && selectedModel.id === defaultModelId
                        ? "text-yellow-300"
                        : ""
                        }`}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                    />
                </svg>
            </Button>
        </div>
    );
}
