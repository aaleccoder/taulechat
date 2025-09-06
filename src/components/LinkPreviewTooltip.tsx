import { useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import LoadingUI from "./loading";
import { fetch } from "@tauri-apps/plugin-http";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerTrigger } from "./ui/drawer";


interface LinkPreviewTooltipProps {
    href: string;
    children: React.ReactNode;
    title?: string;
}

export default function LinkPreviewTooltip({ href, children }: LinkPreviewTooltipProps) {
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const isMobile = useIsMobile();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const fetchMeta = async () => {
        if (href && !meta && !loading && !error) {
            setLoading(true);
            setError(false);
            try {
                const response = await fetch(href, { method: 'GET' });
                if (!response.ok) throw new Error('Network error');
                const html = await response.text();
                const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
                const title = titleMatch ? titleMatch[1] : undefined;
                const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
                const description = descMatch ? descMatch[1] : undefined;
                const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i);
                const canonical = canonicalMatch ? canonicalMatch[1] : undefined;
                const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["'][^>]*>/i);
                const ogImage = ogImageMatch ? ogImageMatch[1] : undefined;
                setMeta({ title, description, canonical, ogImage });
            } catch (e) {
                setError(true);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleTooltipOpenChange = (open: boolean) => {
        if (open) {
            fetchMeta();
        }
    };

    const handleDrawerOpenChange = (open: boolean) => {
        setDrawerOpen(open);
        if (open) {
            fetchMeta();
        }
    };

    const previewContent = (
        <>
            {loading ? (
                <LoadingUI />
            ) : error || !meta ? (
                <div className="bg-card text-white p-3 rounded-lg shadow-md">
                    <p
                        className="cursor-pointer underline hover:text-accent-foreground touch-manipulation min-h-[44px] flex items-center justify-center px-3 py-2 rounded motion-safe:transition-all motion-safe:duration-150 active:scale-95 active:bg-accent/20"
                        onClick={() => openUrl(href)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Open link: ${href}`}
                    >
                        {href}
                    </p>
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col gap-2 p-4 max-w-[90vw] sm:max-w-[40vh]">
                        {meta.title && <div className="font-semibold truncate text-sm">{meta.title}</div>}
                        {meta.description && <div className="text-xs text-muted-foreground line-clamp-2">{meta.description}</div>}
                        <div
                            className="text-xs text-accent break-all cursor-pointer hover:text-accent-foreground underline touch-manipulation min-h-[44px] flex items-center px-3 py-2 -mx-3 rounded motion-safe:transition-all motion-safe:duration-150 active:scale-95 active:bg-accent/20"
                            onClick={() => openUrl(meta.canonical || href)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Open link: ${meta.canonical || href}`}
                        >
                            {meta.canonical || href}
                        </div>
                        {meta.ogImage && <img src={meta.ogImage} alt="Link preview image" className="mt-2 max-w-full max-h-48 w-auto h-auto object-cover rounded shadow-sm" />}
                    </CardContent>
                </Card>
            )}
        </>
    );

    if (isMobile) {
        return (
            <Drawer open={drawerOpen} onOpenChange={handleDrawerOpenChange}>
                <DrawerTrigger asChild>
                    <span
                        className="underline text-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer touch-manipulation select-none motion-safe:transition-colors motion-safe:duration-150 active:bg-accent/20 rounded px-1 py-0.5 min-h-[40px] inline-flex items-center"
                        role="button"
                        tabIndex={0}
                        aria-label={`Preview link: ${href}`}
                    >
                        {children}
                    </span>
                </DrawerTrigger>
                <DrawerContent>
                    <div className="p-4">
                        {previewContent}
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Tooltip onOpenChange={handleTooltipOpenChange}>
            <TooltipTrigger asChild>
                <span
                    className="underline text-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer touch-manipulation select-none motion-safe:transition-colors motion-safe:duration-150 active:bg-accent/20 rounded px-1 py-0.5 min-h-[40px] inline-flex items-center"
                    role="button"
                    tabIndex={0}
                    aria-label={`Preview link: ${href}`}
                >
                    {children}
                </span>
            </TooltipTrigger>
            <TooltipContent className={`${loading ? "bg-card text-white" : "bg-transparent"}`}>
                {previewContent}
            </TooltipContent>
        </Tooltip >
    );
}
