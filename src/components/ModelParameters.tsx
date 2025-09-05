import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { OpenRouterModel, GeminiModel, ModelParameters as ModelParametersType, useStore } from "@/utils/state";
import { getModelParameters, saveModelParameters, removeModelParameters } from "@/utils/store";
import OpenRouterParametersForm from "./forms/OpenRouterParametersForm";

interface ModelParametersProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedModel: (OpenRouterModel | GeminiModel) | null;
}

export default function ModelParameters({
    open,
    onOpenChange,
    selectedModel,
}: ModelParametersProps) {
    const [parameters, setParameters] = useState<ModelParametersType>({});
    const { setModelParameters, getModelParameters: getStoreParameters } = useStore();

    // Load parameters when the drawer opens or model changes
    useEffect(() => {
        if (open && selectedModel?.id) {
            const loadParameters = async () => {
                try {
                    // First try to get from store (in-memory)
                    const storeParams = getStoreParameters(selectedModel.id!);
                    if (storeParams) {
                        setParameters(storeParams);
                        return;
                    }

                    // If not in store, load from persistent storage
                    const savedParams = await getModelParameters(selectedModel.id!);
                    if (savedParams) {
                        setParameters(savedParams);
                        setModelParameters(selectedModel.id!, savedParams);
                    } else {
                        setParameters({});
                    }
                } catch (error) {
                    console.error("Error loading model parameters:", error);
                    setParameters({});
                }
            };

            loadParameters();
        }
    }, [open, selectedModel, getStoreParameters, setModelParameters]);

    const handleSave = async (newParameters: ModelParametersType) => {
        if (!selectedModel?.id) return;

        try {
            // Update store
            setModelParameters(selectedModel.id, newParameters);

            // Save to persistent storage
            await saveModelParameters(selectedModel.id, newParameters);

            setParameters(newParameters);
        } catch (error) {
            console.error("Error saving model parameters:", error);
        }
    };

    const handleReset = async () => {
        if (!selectedModel?.id) return;

        try {
            // Remove from store
            useStore.getState().resetModelParameters(selectedModel.id);

            // Remove from persistent storage
            await removeModelParameters(selectedModel.id);

            setParameters({});
        } catch (error) {
            console.error("Error resetting model parameters:", error);
        }
    };

    const isOpenRouterModel = selectedModel?.provider === "OpenRouter";

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[90vh]">
                <DrawerHeader>
                    <DrawerTitle>Model Parameters</DrawerTitle>
                </DrawerHeader>

                <div className="overflow-y-auto">
                    {selectedModel?.id && isOpenRouterModel ? (
                        <OpenRouterParametersForm
                            model={selectedModel as OpenRouterModel}
                            initialParameters={parameters}
                            onSave={handleSave}
                            onReset={handleReset}
                        />
                    ) : selectedModel && !isOpenRouterModel ? (
                        <div className="p-4 text-center">
                            <p className="text-muted-foreground">
                                Parameter configuration is not yet available for {selectedModel.provider} models.
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 text-center">
                            <p className="text-muted-foreground">
                                Please select a model to configure its parameters.
                            </p>
                        </div>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
