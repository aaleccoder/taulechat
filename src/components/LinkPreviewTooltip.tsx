import { useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import LoadingUI from "./loading";
import { fetch } from "@tauri-apps/plugin-http";
import { openUrl } from "@tauri-apps/plugin-opener";


interface LinkPreviewTooltipProps {
    href: string;
    children: React.ReactNode;
    title?: string;
}

const openLink = (url: string) => {
    openUrl(url);
};

export default function LinkPreviewTooltip({ href, children }: LinkPreviewTooltipProps) {
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const handleTooltipOpenChange = async (open: boolean) => {
        if (open && href && !meta && !loading && !error) {
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

    return (
        <Tooltip onOpenChange={handleTooltipOpenChange}>
            <TooltipTrigger asChild>
                <a
                    href={href}
                    onClick={(e) => { e.preventDefault(); openLink(href); }}
                    className="underline text-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    {children}
                </a>
            </TooltipTrigger>
            <TooltipContent className={`${loading ? "bg-card text-white" : "bg-transparent"}`}>
                {loading ? (
                    <LoadingUI />
                ) : error || !meta ? (
                    <div className="bg-card text-white">
                        <p>{href}</p>
                    </div>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col gap-1 p-3 max-w-[40vh]">
                            {meta.title && <div className="font-semibold truncate">{meta.title}</div>}
                            {meta.description && <div className="text-xs text-muted-foreground truncate">{meta.description}</div>}
                            <div className="text-xs text-accent break-all">{meta.canonical || href}</div>
                            {meta.ogImage && <img src={meta.ogImage} alt="Preview" className="mt-1 max-w-32 max-h-32 w-auto h-auto object-cover rounded" />}
                        </CardContent>
                    </Card>
                )}
            </TooltipContent>
        </Tooltip >
    );
}
