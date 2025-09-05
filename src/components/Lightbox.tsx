import { useLightbox } from "@/utils/state";
import { useCallback } from "react";

export default function Lightbox() {
    const { lightboxImage, setLightboxImage } = useLightbox();

    const handleLightboxClose = useCallback(() => setLightboxImage(null), [setLightboxImage]);

    const handleImageDownload = useCallback((base64: string) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64}`;
        link.download = 'generated-image.png';
        link.click();
    }, []);

    if (!lightboxImage) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={handleLightboxClose}>
            <div className="bg-card rounded-lg p-4 shadow-lg relative" onClick={e => e.stopPropagation()}>
                <img src={`data:image/png;base64,${lightboxImage}`} alt="Large view" className="max-w-[90vw] max-h-[80vh] rounded-lg" />
                <button
                    className="absolute top-2 right-2 text-foreground bg-background rounded-full px-2 py-1 shadow-md"
                    onClick={handleLightboxClose}
                    aria-label="Close"
                >
                    Close
                </button>
                <button
                    className="absolute bottom-2 right-2 text-xs underline text-accent hover:text-accent/80"
                    onClick={() => handleImageDownload(lightboxImage)}
                    aria-label="Download image"
                >
                    Download
                </button>
            </div>
        </div>
    );
}
