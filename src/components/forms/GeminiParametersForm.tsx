import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Info } from "lucide-react";
import { GeminiModel, ModelParameters } from "@/utils/state";

interface GeminiParametersFormProps {
    model: GeminiModel;
    initialParameters: ModelParameters;
    onSave: (parameters: ModelParameters) => void;
    onReset: () => void;
}

export default function GeminiParametersForm({
    model,
    initialParameters,
    onSave,
    onReset
}: GeminiParametersFormProps) {
    const [parameters, setParameters] = useState<ModelParameters>(initialParameters);
    const [stopSequencesInput, setStopSequencesInput] = useState<string>("");

    useEffect(() => {
        setParameters(initialParameters);
        // Convert stop_sequences array to comma-separated string for input
        if (initialParameters.stop_sequences) {
            setStopSequencesInput(initialParameters.stop_sequences.join(", "));
        } else {
            setStopSequencesInput("");
        }
    }, [initialParameters]);

    const handleParameterChange = (key: keyof ModelParameters, value: any) => {
        setParameters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleStopSequencesChange = (value: string) => {
        setStopSequencesInput(value);
        const sequences = value
            .split(",")
            .map(s => s.trim())
            .filter(s => s.length > 0);
        handleParameterChange("stop_sequences", sequences.length > 0 ? sequences : undefined);
    };

    const handleSave = () => {
        onSave(parameters);
    };

    const handleReset = () => {
        setParameters({});
        setStopSequencesInput("");
        onReset();
    };

    return (
        <div className="space-y-6 p-4">
            {/* Notice */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Note:</strong> Not all parameters are supported by every Gemini model.
                        Some parameters may be ignored depending on the specific model version.
                    </p>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        onClick={() => window.open("https://ai.google.dev/gemini-api/docs/text-generation#configure-model-parameters", "_blank")}
                    >
                        View Google AI Studio documentation
                        <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                </div>
            </div>

            {/* Model Info */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">{model.displayName || model.name}</h3>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Version: {model.version}</Badge>
                    <Badge variant="outline">Input: {model.inputTokenLimit?.toLocaleString() || 'Unknown'} tokens</Badge>
                    <Badge variant="outline">Output: {model.outputTokenLimit?.toLocaleString() || 'Unknown'} tokens</Badge>
                </div>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="temperature">Temperature</Label>
                    <span className="text-sm text-muted-foreground">
                        {parameters.temperature !== undefined ? parameters.temperature.toFixed(2) : 'Default'}
                    </span>
                </div>
                <Slider
                    id="temperature"
                    min={0}
                    max={2}
                    step={0.01}
                    value={[parameters.temperature ?? 0.9]}
                    onValueChange={([value]) => handleParameterChange('temperature', value)}
                    className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                    Controls randomness. Higher values make output more random, lower values more focused.
                </p>
            </div>

            {/* Max Output Tokens */}
            <div className="space-y-2">
                <Label htmlFor="max-tokens">Maximum Output Tokens</Label>
                <Input
                    id="max-tokens"
                    type="number"
                    min={1}
                    max={model.outputTokenLimit || 8192}
                    value={parameters.max_tokens || ""}
                    onChange={(e) => {
                        const value = e.target.value;
                        handleParameterChange('max_tokens', value ? parseInt(value) : undefined);
                    }}
                    placeholder={`Default (up to ${model.outputTokenLimit || 8192})`}
                />
                <p className="text-xs text-muted-foreground">
                    Maximum number of tokens to generate in the response.
                </p>
            </div>

            {/* Top P */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="top-p">Top P (Nucleus sampling)</Label>
                    <span className="text-sm text-muted-foreground">
                        {parameters.top_p !== undefined ? parameters.top_p.toFixed(2) : 'Default'}
                    </span>
                </div>
                <Slider
                    id="top-p"
                    min={0}
                    max={1}
                    step={0.01}
                    value={[parameters.top_p ?? 0.95]}
                    onValueChange={([value]) => handleParameterChange('top_p', value)}
                    className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                    Controls diversity via nucleus sampling. 0.9 means only tokens with top 90% probability mass are considered.
                </p>
            </div>

            {/* Top K */}
            <div className="space-y-2">
                <Label htmlFor="top-k">Top K</Label>
                <Input
                    id="top-k"
                    type="number"
                    min={1}
                    max={100}
                    value={parameters.top_k || ""}
                    onChange={(e) => {
                        const value = e.target.value;
                        handleParameterChange('top_k', value ? parseInt(value) : undefined);
                    }}
                    placeholder="Default (model-dependent)"
                />
                <p className="text-xs text-muted-foreground">
                    Limits the model to consider only the top K most likely tokens at each step.
                </p>
            </div>

            {/* Candidate Count */}
            <div className="space-y-2">
                <Label htmlFor="candidate-count">Candidate Count</Label>
                <Input
                    id="candidate-count"
                    type="number"
                    min={1}
                    max={8}
                    value={parameters.candidate_count || ""}
                    onChange={(e) => {
                        const value = e.target.value;
                        handleParameterChange('candidate_count', value ? parseInt(value) : undefined);
                    }}
                    placeholder="Default (1)"
                />
                <p className="text-xs text-muted-foreground">
                    Number of response candidates to generate. Only the first candidate is returned.
                </p>
            </div>

            {/* Seed */}
            <div className="space-y-2">
                <Label htmlFor="seed">Seed</Label>
                <Input
                    id="seed"
                    type="number"
                    value={parameters.seed || ""}
                    onChange={(e) => {
                        const value = e.target.value;
                        handleParameterChange('seed', value ? parseInt(value) : undefined);
                    }}
                    placeholder="Random"
                />
                <p className="text-xs text-muted-foreground">
                    Random seed for deterministic generation. Same seed with same parameters should produce similar results.
                </p>
            </div>

            {/* Presence Penalty */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="presence-penalty">Presence Penalty</Label>
                    <span className="text-sm text-muted-foreground">
                        {parameters.presence_penalty !== undefined ? parameters.presence_penalty.toFixed(2) : 'Default'}
                    </span>
                </div>
                <Slider
                    id="presence-penalty"
                    min={-2}
                    max={2}
                    step={0.01}
                    value={[parameters.presence_penalty ?? 0]}
                    onValueChange={([value]) => handleParameterChange('presence_penalty', value)}
                    className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                    Penalizes tokens that have already appeared in the text. Positive values reduce repetition.
                </p>
            </div>

            {/* Frequency Penalty */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="frequency-penalty">Frequency Penalty</Label>
                    <span className="text-sm text-muted-foreground">
                        {parameters.frequency_penalty !== undefined ? parameters.frequency_penalty.toFixed(2) : 'Default'}
                    </span>
                </div>
                <Slider
                    id="frequency-penalty"
                    min={-2}
                    max={2}
                    step={0.01}
                    value={[parameters.frequency_penalty ?? 0]}
                    onValueChange={([value]) => handleParameterChange('frequency_penalty', value)}
                    className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                    Penalizes tokens based on their frequency in the text. Higher values reduce repetition.
                </p>
            </div>

            {/* Stop Sequences */}
            <div className="space-y-2">
                <Label htmlFor="stop-sequences">Stop Sequences</Label>
                <Input
                    id="stop-sequences"
                    value={stopSequencesInput}
                    onChange={(e) => handleStopSequencesChange(e.target.value)}
                    placeholder="e.g., END, \n\n, ..."
                />
                <p className="text-xs text-muted-foreground">
                    Comma-separated list of sequences where the model should stop generating.
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={handleReset}>
                    Reset to Default
                </Button>
                <Button onClick={handleSave}>
                    Save Parameters
                </Button>
            </div>
        </div>
    );
}
