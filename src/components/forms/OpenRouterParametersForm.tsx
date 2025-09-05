import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ModelParameters, OpenRouterModel } from "@/utils/state";
import { toast } from "sonner";

interface OpenRouterParametersFormProps {
    model: OpenRouterModel;
    initialParameters: ModelParameters;
    onSave: (parameters: ModelParameters) => void;
    onReset: () => void;
}

export default function OpenRouterParametersForm({
    model,
    initialParameters,
    onSave,
    onReset,
}: OpenRouterParametersFormProps) {
    const [parameters, setParameters] = useState<ModelParameters>(initialParameters);

    // Helper function to check if a parameter is supported
    const isParameterSupported = (paramName: string): boolean => {
        return Array.isArray(model.supported_parameters) && model.supported_parameters.includes(paramName);
    };

    const handleSave = () => {
        // Validate parameters
        if (parameters.temperature !== undefined && (parameters.temperature < 0 || parameters.temperature > 2)) {
            toast.error("Temperature must be between 0 and 2");
            return;
        }
        if (parameters.max_tokens !== undefined && parameters.max_tokens < 1) {
            toast.error("Max tokens must be greater than 0");
            return;
        }
        if (parameters.top_p !== undefined && (parameters.top_p <= 0 || parameters.top_p > 1)) {
            toast.error("Top P must be between 0 and 1");
            return;
        }
        if (parameters.frequency_penalty !== undefined && (parameters.frequency_penalty < -2 || parameters.frequency_penalty > 2)) {
            toast.error("Frequency penalty must be between -2 and 2");
            return;
        }
        if (parameters.presence_penalty !== undefined && (parameters.presence_penalty < -2 || parameters.presence_penalty > 2)) {
            toast.error("Presence penalty must be between -2 and 2");
            return;
        }

        onSave(parameters);
        toast.success("Parameters saved successfully");
    };

    const handleReset = () => {
        setParameters({});
        onReset();
        toast.success("Parameters reset to defaults");
    };

    const updateParameter = (key: keyof ModelParameters, value: any) => {
        setParameters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6 p-4">
            <div className="space-y-2">
                <h3 className="text-lg font-medium">Model Parameters</h3>
                <p className="text-sm text-muted-foreground">
                    Configure parameters for {model.name || model.id}
                </p>
            </div>

            <Separator />

            {/* Basic Parameters */}
            <div className="space-y-4">
                <h4 className="text-sm font-medium">Basic Parameters</h4>

                {/* Temperature */}
                {isParameterSupported('temperature') && (
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="temperature">Temperature</Label>
                            <span className="text-sm text-muted-foreground">
                                {parameters.temperature?.toFixed(2) ?? "default"}
                            </span>
                        </div>
                        <Slider
                            value={[parameters.temperature ?? 1]}
                            onValueChange={(value: number[]) => updateParameter('temperature', value[0])}
                            min={0}
                            max={2}
                            step={0.01}
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            Controls randomness. Lower values make output more focused and deterministic.
                        </p>
                    </div>
                )}

                {/* Max Tokens */}
                {isParameterSupported('max_tokens') && (
                    <div className="space-y-2">
                        <Label htmlFor="max_tokens">Max Tokens</Label>
                        <Input
                            id="max_tokens"
                            type="number"
                            placeholder="default"
                            value={parameters.max_tokens ?? ""}
                            onChange={(e) => updateParameter('max_tokens', e.target.value ? parseInt(e.target.value) : undefined)}
                            min="1"
                        />
                        <p className="text-xs text-muted-foreground">
                            Maximum number of tokens to generate in the response.
                        </p>
                    </div>
                )}

                {/* Top P */}
                {isParameterSupported('top_p') && (
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="top_p">Top P</Label>
                            <span className="text-sm text-muted-foreground">
                                {parameters.top_p?.toFixed(2) ?? "default"}
                            </span>
                        </div>
                        <Slider
                            value={[parameters.top_p ?? 1]}
                            onValueChange={(value: number[]) => updateParameter('top_p', value[0])}
                            min={0.01}
                            max={1}
                            step={0.01}
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            Nucleus sampling. Only tokens with cumulative probability up to this value are considered.
                        </p>
                    </div>
                )}

                {/* Top K */}
                {isParameterSupported('top_k') && (
                    <div className="space-y-2">
                        <Label htmlFor="top_k">Top K</Label>
                        <Input
                            id="top_k"
                            type="number"
                            placeholder="default"
                            value={parameters.top_k ?? ""}
                            onChange={(e) => updateParameter('top_k', e.target.value ? parseInt(e.target.value) : undefined)}
                            min="1"
                        />
                        <p className="text-xs text-muted-foreground">
                            Only consider the top K most likely tokens at each step.
                        </p>
                    </div>
                )}
            </div>

            <Separator />

            {/* Penalty Parameters */}
            <div className="space-y-4">
                <h4 className="text-sm font-medium">Penalty Parameters</h4>

                {/* Frequency Penalty */}
                {isParameterSupported('frequency_penalty') && (
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="frequency_penalty">Frequency Penalty</Label>
                            <span className="text-sm text-muted-foreground">
                                {parameters.frequency_penalty?.toFixed(2) ?? "default"}
                            </span>
                        </div>
                        <Slider
                            value={[parameters.frequency_penalty ?? 0]}
                            onValueChange={(value: number[]) => updateParameter('frequency_penalty', value[0])}
                            min={-2}
                            max={2}
                            step={0.01}
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            Penalize tokens based on their frequency in the text. Higher values reduce repetition.
                        </p>
                    </div>
                )}

                {/* Presence Penalty */}
                {isParameterSupported('presence_penalty') && (
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="presence_penalty">Presence Penalty</Label>
                            <span className="text-sm text-muted-foreground">
                                {parameters.presence_penalty?.toFixed(2) ?? "default"}
                            </span>
                        </div>
                        <Slider
                            value={[parameters.presence_penalty ?? 0]}
                            onValueChange={(value: number[]) => updateParameter('presence_penalty', value[0])}
                            min={-2}
                            max={2}
                            step={0.01}
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            Penalize tokens based on whether they appear in the text. Encourages topic diversity.
                        </p>
                    </div>
                )}

                {/* Repetition Penalty */}
                {isParameterSupported('repetition_penalty') && (
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="repetition_penalty">Repetition Penalty</Label>
                            <span className="text-sm text-muted-foreground">
                                {parameters.repetition_penalty?.toFixed(2) ?? "default"}
                            </span>
                        </div>
                        <Slider
                            value={[parameters.repetition_penalty ?? 1]}
                            onValueChange={(value: number[]) => updateParameter('repetition_penalty', value[0])}
                            min={0.1}
                            max={2}
                            step={0.01}
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            Alternative repetition penalty. Values &gt; 1 discourage repetition.
                        </p>
                    </div>
                )}
            </div>

            <Separator />

            {/* Advanced Parameters */}
            <div className="space-y-4">
                <h4 className="text-sm font-medium">Advanced Parameters</h4>

                {/* Seed */}
                {isParameterSupported('seed') && (
                    <div className="space-y-2">
                        <Label htmlFor="seed">Seed</Label>
                        <Input
                            id="seed"
                            type="number"
                            placeholder="random"
                            value={parameters.seed ?? ""}
                            onChange={(e) => updateParameter('seed', e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Seed for random number generation. Use the same seed for reproducible results.
                        </p>
                    </div>
                )}

                {/* Min P */}
                {isParameterSupported('min_p') && (
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="min_p">Min P</Label>
                            <span className="text-sm text-muted-foreground">
                                {parameters.min_p?.toFixed(3) ?? "default"}
                            </span>
                        </div>
                        <Slider
                            value={[parameters.min_p ?? 0]}
                            onValueChange={(value: number[]) => updateParameter('min_p', value[0])}
                            min={0}
                            max={1}
                            step={0.001}
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            Minimum probability threshold for token selection.
                        </p>
                    </div>
                )}

                {/* Response Format */}
                {isParameterSupported('response_format') && (
                    <div className="space-y-2">
                        <Label htmlFor="response_format">Response Format</Label>
                        <select
                            id="response_format"
                            value={parameters.response_format?.type ?? ""}
                            onChange={(e) => {
                                if (e.target.value === "json_object") {
                                    updateParameter('response_format', { type: 'json_object' });
                                } else {
                                    updateParameter('response_format', undefined);
                                }
                            }}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        >
                            <option value="">Default</option>
                            <option value="json_object">JSON Object</option>
                        </select>
                        <p className="text-xs text-muted-foreground">
                            Force the model to respond with a specific format.
                        </p>
                    </div>
                )}

                {/* Tools */}
                {(isParameterSupported('tools') || isParameterSupported('tool_choice')) && (
                    <div className="space-y-2">
                        <Label>Tool Support</Label>
                        <div className="p-3 border border-border rounded-md bg-muted/50">
                            <p className="text-sm text-muted-foreground">
                                🔧 This model supports tool calling and function execution.
                            </p>
                        </div>
                    </div>
                )}

                {/* Reasoning */}
                {isParameterSupported('reasoning') && (
                    <div className="space-y-2">
                        <Label>Reasoning Support</Label>
                        <div className="p-3 border border-border rounded-md bg-purple-50 dark:bg-purple-900/20">
                            <div className="flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-purple-600">
                                    <path d="M9.5 2A7.5 7.5 0 0 0 4 10c0 6 3.5 9 5.5 10 2-1 5.5-4 5.5-10A7.5 7.5 0 0 0 9.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M8 10h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M8 13h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                                    This model supports advanced reasoning and thinking processes.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stop Sequences */}
                <div className="space-y-2">
                    <Label htmlFor="stop">Stop Sequences</Label>
                    <Input
                        id="stop"
                        placeholder="Enter sequences separated by commas"
                        value={Array.isArray(parameters.stop) ? parameters.stop.join(', ') : parameters.stop ?? ""}
                        onChange={(e) => {
                            const value = e.target.value.trim();
                            if (value) {
                                const sequences = value.split(',').map(s => s.trim()).filter(s => s);
                                updateParameter('stop', sequences.length === 1 ? sequences[0] : sequences);
                            } else {
                                updateParameter('stop', undefined);
                            }
                        }}
                    />
                    <p className="text-xs text-muted-foreground">
                        Sequences where the model will stop generating. Separate multiple sequences with commas.
                    </p>
                </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={handleReset}>
                    Reset to Defaults
                </Button>
                <Button onClick={handleSave}>
                    Save Parameters
                </Button>
            </div>
        </div>
    );
}
