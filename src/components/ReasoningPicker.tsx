import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ReasoningLevel } from "@/utils/state";
import { useIsMobile } from "@/hooks/use-mobile";

interface ReasoningPickerProps {
    reasoningLevel: ReasoningLevel;
    setReasoningLevel: (level: ReasoningLevel) => void;
    disabled?: boolean;
    compact?: boolean;
}

const reasoningLevels: { level: ReasoningLevel; label: string; description: string }[] = [
    { level: 'low', label: 'Low', description: 'Basic reasoning for quick responses' },
    { level: 'medium', label: 'Medium', description: 'Balanced reasoning and speed' },
    { level: 'high', label: 'High', description: 'Deep reasoning for complex problems' }
];

export default function ReasoningPicker({ reasoningLevel, setReasoningLevel, disabled, compact = false }: ReasoningPickerProps) {
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();

    // Use compact for styling adjustments
    const triggerClass = compact ? "h-7 text-xs px-2" : "h-8 px-3";

    const currentLevel = reasoningLevels.find(level => level.level === reasoningLevel);

    const triggerButton = (
        <Button
            variant="outline"
            size="sm"
            className={`rounded-full px-3 gap-2 motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95 ${triggerClass}`}
            disabled={disabled}
            aria-label="Select reasoning level"
            title="Select reasoning level"
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
            <span className="text-xs font-medium">{currentLevel?.label}</span>
        </Button>
    );

    const reasoningOptions = (
        <div className="space-y-2">
            {reasoningLevels.map((level) => (
                <Button
                    key={level.level}
                    variant={reasoningLevel === level.level ? "default" : "ghost"}
                    className="w-full justify-start h-auto py-3 px-4 motion-safe:transition-all motion-safe:duration-150 active:bg-transparent active:scale-95 hover:bg-accent/10"
                    onClick={() => {
                        setReasoningLevel(level.level);
                        setOpen(false);
                    }}
                >
                    <div className="flex items-center gap-3 w-full">
                        <div className="flex flex-col items-start flex-1 gap-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{level.label}</span>
                                {reasoningLevel === level.level && (
                                    <Badge variant="outline" className="text-xs bg-card text-card-foreground border-border">
                                        Selected
                                    </Badge>
                                )}
                            </div>
                            <span className="text-sm text-left">
                                {level.description}
                            </span>
                        </div>
                    </div>
                </Button>
            ))}
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                    {triggerButton}
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Reasoning Level</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-8">
                        {reasoningOptions}
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {triggerButton}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none mb-3">Reasoning Level</h4>
                    {reasoningOptions}
                </div>
            </PopoverContent>
        </Popover>
    );
}
