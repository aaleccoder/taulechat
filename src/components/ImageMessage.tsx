import { memo, useCallback } from "react";
import { useLightbox } from "@/utils/state";
import { getBase64FromData, getDataUrl } from "@/lib/utils";
import type { ChatMessage } from "@/utils/state";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageMessageProps {
    message: ChatMessage;
}

const ImageMessage = memo(function ImageMessage({ message }: ImageMessageProps) {
    const { setLightboxImage } = useLightbox();

    const handleImageClick = useCallback((base64: string) => {
        setLightboxImage(base64);
    }, [setLightboxImage]);

    const handleImageDownload = useCallback((base64: string) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64}`;
        link.download = 'generated-image.png';
        toast.success('Image download started! Check your Downloads folder.');
        link.click();

    }, []);

    const imageFiles = (message.files || []).filter(f => f.mime_type.startsWith('image/'));

    if (imageFiles.length === 0) {
        return null;
    }

    return (
        <>
            {
                imageFiles.length > 0 && (
                    <div className="ml-auto max-w-full">
                        <div className="flex gap-2 overflow-x-auto pb-1 rounded-xl bg-card px-2 py-2 shadow-md"
                            role="list"
                            aria-label="Image attachments">
                            {imageFiles.map((file: any) => {
                                let base64: string;
                                let dataUrl: string;

                                try {
                                    base64 = getBase64FromData(file.data);
                                    dataUrl = getDataUrl(file.data, file.mime_type);
                                } catch (error) {
                                    console.error('Error processing image data:', error, file);
                                    return null;
                                }

                                return (
                                    <div
                                        key={file.id}
                                        className="flex flex-col items-center gap-1 bg-background rounded-lg p-2 shadow motion-safe:transition-shadow"
                                        role="listitem"
                                    >
                                        <div className="relative mb-1">
                                            <button
                                                className="rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                                onClick={() => handleImageClick(base64)}
                                                aria-label={`Open image ${file.file_name}`}
                                                title={`Open image ${file.file_name}`}
                                                tabIndex={0}
                                            >
                                                <span className="sr-only">Open image {file.file_name}</span>
                                                <img
                                                    src={dataUrl}
                                                    alt={file.file_name}
                                                    draggable={false}
                                                    className="block w-auto h-auto max-w-[160px] max-h-48 rounded-lg object-contain"
                                                    onError={(e) => {
                                                        console.error('Image failed to load:', {
                                                            src: dataUrl,
                                                            file: file,
                                                            error: e
                                                        });
                                                    }}
                                                />
                                            </button>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="absolute top-1 right-1 h-9 w-9 rounded-full motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95 text-xs shadow-md z-10"
                                                onClick={() => handleImageDownload(base64)}
                                                aria-label={`Download ${file.file_name}`}
                                                title={`Download ${file.file_name}`}
                                            >
                                                <span className="sr-only">Download {file.file_name}</span>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 text-accent"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    aria-hidden="true"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                                                </svg>
                                            </Button>
                                        </div>

                                        <div className="text-xs text-muted-foreground truncate max-w-28" title={file.file_name}>
                                            {file.file_name}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            }
        </>
    );
});

export default ImageMessage;
