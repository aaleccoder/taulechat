import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function AttachmentStrip({ attachments, onRemove }: {
    attachments: {
        id: string;
        fileName: string;
        mimeType: string;
        base64: string;
        bytes: Uint8Array;
        size: number;
        url?: string;
    }[];
    onRemove: (id: string) => void;
}) {
    if (!attachments.length) return null;
    return (
        <div className="attachments-strip" aria-label="Attachments preview">
            {attachments.map((att) => (
                <div key={att.id} className="attachment-item">
                    {att.url && att.mimeType.startsWith("image/") ? (
                        <img src={att.url} alt={att.fileName} className="attachment-img" />
                    ) : (
                        <div className="attachment-file-icon">
                            {att.fileName.split(".").pop()?.toUpperCase()}
                        </div>
                    )}
                    <div className="attachment-details">
                        <div className="attachment-name" title={att.fileName}>{att.fileName}</div>
                        <div className="attachment-size">{Math.round(att.size / 1024)} KB</div>
                    </div>
                    <Button
                        type="button"
                        aria-label={`Remove ${att.fileName}`}
                        title="Remove attachment"
                        variant="ghost"
                        size="icon"
                        className="attachment-remove-btn"
                        onClick={() => onRemove(att.id)}
                    >
                        <X />
                    </Button>
                </div>
            ))}
        </div>
    );
}
