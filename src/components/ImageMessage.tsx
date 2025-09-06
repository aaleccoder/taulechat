import { memo, useCallback } from "react";
import { useLightbox } from "@/utils/state";
import { getBase64FromData, getDataUrl } from "@/lib/utils";
import type { ChatMessage } from "@/utils/state";
import { Button } from "@/components/ui/button";

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
        link.click();
    }, []);

    const imageFiles = (message.files || []).filter(f => f.mime_type.startsWith('image/'));

    if (imageFiles.length === 0) {
        return null;
    }

    return (
        <div
            key={message.id}
            className="flex flex-col items-start gap-2 bg-card rounded-xl px-3 py-3 shadow-md"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            {message.content && (
                <div className="mb-1 text-foreground text-sm">
                    {message.content}
                </div>
            )}
            <div
                className="flex gap-2 overflow-x-auto pb-1 border bg-background px-2 py-2 shadow-md focus-within:ring-2 focus-within:ring-ring/50 motion-safe:transition-shadow"
                role="list"
                aria-label="Image attachments"
            >
                {imageFiles.map((file) => {
                    let base64: string;
                    let dataUrl: string;

                    try {
                        // Debug logging
                        console.log('Processing file data:', {
                            id: file.id,
                            fileName: file.file_name,
                            dataType: typeof file.data,
                            dataLength: file.data?.length || 0,
                            dataPreview: typeof file.data === 'string' ? file.data.substring(0, 50) + '...' : 'Uint8Array',
                            mimeType: file.mime_type
                        });

                        base64 = getBase64FromData(file.data);
                        dataUrl = getDataUrl(file.data, file.mime_type);

                        console.log('Successfully processed image data:', {
                            id: file.id,
                            base64Length: base64.length,
                            dataUrlLength: dataUrl.length
                        });
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
                            <button
                                className="h-14 w-14 rounded-full motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95 flex items-center justify-center shadow-lg mb-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                onClick={() => handleImageClick(base64)}
                                aria-label={`Open image ${file.file_name}`}
                                title={`Open image ${file.file_name}`}
                                tabIndex={0}
                            >
                                <span className="sr-only">Open image {file.file_name}</span>
                                <img
                                    src={dataUrl}
                                    alt={file.file_name}
                                    className="max-h-32 max-w-32 rounded-lg object-cover"
                                    draggable={false}
                                    onError={(e) => {
                                        console.error('Image failed to load:', {
                                            src: dataUrl,
                                            file: file,
                                            error: e
                                        });
                                    }}
                                />
                            </button>
                            <div className="text-xs text-muted-foreground truncate max-w-28" title={file.file_name}>
                                {file.file_name}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-10 w-10 rounded-full motion-safe:transition-all motion-safe:duration-150 hover:bg-accent/10 active:scale-95 text-xs"
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
                    );
                })}
            </div>
        </div>
    );
});

export default ImageMessage;
