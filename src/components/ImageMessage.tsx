import { memo, useCallback } from "react";
import { useLightbox } from "@/utils/state";
import { uint8ToBase64 } from "@/lib/utils";
import type { ChatMessage } from "@/utils/state";

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
        <div key={message.id} className="flex flex-col items-start">
            {message.content && (
                <div className="mb-2">
                    {message.content}
                </div>
            )}
            <div className="flex gap-2 mb-2">
                {imageFiles.map((file) => {
                    const base64 = typeof file.data === 'string' ? file.data : uint8ToBase64(file.data);
                    return (
                        <div key={file.id} className="flex flex-col items-center">
                            <img
                                src={`data:${file.mime_type};base64,${base64}`}
                                alt={file.file_name}
                                className="max-w-xs rounded-lg cursor-pointer shadow-md"
                                onClick={() => handleImageClick(base64)}
                                style={{ marginBottom: 8 }}
                            />
                            <button
                                className="mt-1 text-xs underline text-accent hover:text-accent/80"
                                onClick={() => handleImageDownload(base64)}
                                aria-label="Download image"
                            >
                                Download
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

export default ImageMessage;
