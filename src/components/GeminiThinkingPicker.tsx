import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { saveGeminiThinking } from "@/utils/store";

interface GeminiThinkingPickerProps {
    thinkingEnabled: boolean;
    setThinkingEnabled: (enabled: boolean) => void;
    disabled?: boolean;
    compact?: boolean;
}

const thinkingOptions = [
    { value: true, label: 'On', description: 'Show AI reasoning process and thoughts' },
    { value: false, label: 'Off', description: 'Hide internal reasoning for faster responses' }
];

export default function GeminiThinkingPicker({ thinkingEnabled, setThinkingEnabled, disabled, compact = false }: GeminiThinkingPickerProps) {
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();

    // Use compact for styling adjustments
    const triggerClass = compact ? "h-7 text-xs px-2" : "h-8 px-3";

    const currentOption = thinkingOptions.find(option => option.value === thinkingEnabled);

    const triggerButton = (
        <Button
            variant="outline"
            size="sm"
            className={`chat-input-buttons`}
            disabled={disabled}
            aria-label="Toggle thinking mode"
            title="Toggle thinking mode"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-4"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 0 0-3.09 3.091ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
                />
            </svg>
            <span className="text-xs font-medium">Thinking: {currentOption?.label}</span>
        </Button>
    );

    const thinkingOptionsContent = (
        <div className="space-y-2">
            {thinkingOptions.map((option) => (
                <button
                    key={option.value.toString()}
                    className="flex w-full items-start gap-3 rounded-lg border border-transparent p-3 text-left hover:border-border hover:bg-accent/5 transition-colors"
                    onClick={async () => {
                        setThinkingEnabled(option.value);
                        setOpen(false);
                        try {
                            await saveGeminiThinking(option.value);
                        } catch (error) {
                            console.error('Error saving thinking preference:', error);
                        }
                    }}
                >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 mt-0.5">
                        {thinkingEnabled === option.value && (
                            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                        )}
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium">{option.label}</h4>
                            {thinkingEnabled === option.value && (
                                <Badge variant="secondary" className="h-5 px-2 text-xs">Current</Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {option.description}
                        </p>
                    </div>
                </button>
            ))}
        </div>
    );

    return (
        <>
            {isMobile ? (
                <Drawer open={open} onOpenChange={setOpen}>
                    <DrawerTrigger asChild>
                        {triggerButton}
                    </DrawerTrigger>
                    <DrawerContent>
                        <DrawerHeader>
                            <DrawerTitle>Thinking Mode</DrawerTitle>
                        </DrawerHeader>
                        <div className="px-4 pb-4">
                            {thinkingOptionsContent}
                        </div>
                    </DrawerContent>
                </Drawer>
            ) : (
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        {triggerButton}
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="start">
                        <div className="space-y-4">
                            <h4 className="font-medium">Thinking Mode</h4>
                            {thinkingOptionsContent}
                        </div>
                    </PopoverContent>
                </Popover>
            )}
        </>
    );
}
