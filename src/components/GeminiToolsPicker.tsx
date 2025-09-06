import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { GeminiTool } from "@/utils/state";
import { getGeminiTools, saveGeminiTools } from "@/utils/store";

interface GeminiToolsPickerProps {
    selectedTools: GeminiTool[];
    onToolsChange: (tools: GeminiTool[]) => void;
    disabled?: boolean;
    compact?: boolean;
}

const AVAILABLE_TOOLS: { id: GeminiTool; label: string; description: string }[] = [
    {
        id: 'google_search',
        label: 'Google Search',
        description: 'Search the web for current information'
    },
    {
        id: 'url_context',
        label: 'URL Context',
        description: 'Access and analyze web page content'
    },
    {
        id: 'code_execution',
        label: 'Code Execution',
        description: 'Execute code and perform calculations'
    }
];

export default function GeminiToolsPicker({ selectedTools, onToolsChange, disabled = false, compact = false }: GeminiToolsPickerProps) {
    const [open, setOpen] = useState(false);
    const [defaultTools, setDefaultTools] = useState<GeminiTool[]>([]);

    useEffect(() => {
        const loadDefaultTools = async () => {
            try {
                const tools = await getGeminiTools();
                setDefaultTools(tools as GeminiTool[]);
            } catch (error) {
                console.error('Error loading default Gemini tools:', error);
            }
        };
        loadDefaultTools();
    }, []);

    const handleToolToggle = (tool: GeminiTool, checked: boolean) => {
        const newTools = checked
            ? [...selectedTools, tool]
            : selectedTools.filter(t => t !== tool);
        onToolsChange(newTools);
    };

    const handleSaveAsDefault = async () => {
        try {
            await saveGeminiTools(selectedTools);
            setDefaultTools(selectedTools);
        } catch (error) {
            console.error('Error saving default tools:', error);
        }
    };

    const handleLoadDefault = () => {
        onToolsChange(defaultTools);
    };

    const hasSelectedTools = selectedTools.length > 0;
    const hasDefaultTools = defaultTools.length > 0;

    const buttonSize = compact ? "sm" : "sm";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size={buttonSize}
                    className={`chat-input-buttons`}
                    disabled={disabled}
                    aria-label="Configure Gemini tools"
                    title="Configure Gemini tools"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4 mr-1"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
                    </svg>
                    Tools
                    {hasSelectedTools && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-accent rounded-full">
                            {selectedTools.length}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Gemini Tools</h4>
                        <div className="flex gap-1">
                            {hasDefaultTools && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs rounded-full"
                                    onClick={handleLoadDefault}
                                >
                                    Load Default
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs rounded-full"
                                onClick={handleSaveAsDefault}
                                disabled={!hasSelectedTools}
                            >
                                Save as Default
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {AVAILABLE_TOOLS.map((tool) => (
                            <div key={tool.id} className="flex items-start space-x-3">
                                <Checkbox
                                    id={tool.id}
                                    checked={selectedTools.includes(tool.id)}
                                    onCheckedChange={(checked) =>
                                        handleToolToggle(tool.id, checked as boolean)
                                    }
                                />
                                <div className="flex-1 space-y-1">
                                    <Label
                                        htmlFor={tool.id}
                                        className="text-sm font-medium leading-none cursor-pointer"
                                    >
                                        {tool.label}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {tool.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {selectedTools.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                            No tools selected. The model will work without additional capabilities.
                        </p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
