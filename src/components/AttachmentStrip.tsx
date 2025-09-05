import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";

export default function AttachmentStrip({ attachments, onRemove }: {
    attachments: {
        id: string;
        fileName: string;
        mimeType: string;
        base64: string;
        bytes: Uint8Array;
        size: number;
        url?: string;
        isLoading?: boolean;
    }[];
    onRemove: (id: string) => void;
}) {
    if (!attachments.length) return null;
    return (
        <div className="attachments-strip" aria-label="Attachments preview">
            {attachments.map((att) => (
                <div key={att.id} className={`attachment-item ${att.isLoading ? 'attachment-loading' : ''}`}>
                    {att.isLoading ? (
                        <div className="attachment-loading-placeholder">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Processing...</span>
                        </div>
                    ) : att.url && att.mimeType.startsWith("image/") ? (
                        <img src={att.url} alt={att.fileName} className="attachment-img" />
                    ) : (
                        <div className="attachment-file-icon">
                            {att.fileName.split(".").pop()?.toUpperCase()}
                        </div>
                    )}
                    <div className="attachment-details">
                        <div className="attachment-name" title={att.fileName}>{att.fileName}</div>
                        {!att.isLoading && (
                            <div className="attachment-size">{Math.round(att.size / 1024)} KB</div>
                        )}
                    </div>
                    <Button
                        type="button"
                        aria-label={`Remove ${att.fileName}`}
                        title="Remove attachment"
                        variant="ghost"
                        size="icon"
                        className="attachment-remove-btn"
                        onClick={() => onRemove(att.id)}
                        disabled={att.isLoading}
                    >
                        <X />
                    </Button>
                </div>
            ))}
        </div>
    );
}
