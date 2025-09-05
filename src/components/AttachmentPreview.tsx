import { useFilePreview } from "@/hooks/useFilePreview";

interface FileType {
    id: string;
    mime_type: string;
    data: any;
    file_name: string;
    size: number;
}

export default function AttachmentPreview({ file }: { file: FileType }) {
    const { previewUrl, isImage } = useFilePreview(file);
    return (
        <div className="border rounded-lg p-2 bg-card w-fit max-w-[50%] min-w-0">
            {isImage && previewUrl ? (
                <img src={previewUrl} className="max-w-[200px] max-h-[200px] object-cover rounded" />
            ) : (
                <div className="text-xs flex items-center gap-2 min-w-0">
                    <span className="px-2 py-1 bg-muted rounded truncate">{file.file_name}</span>
                    <span className="opacity-60 flex-shrink-0">{Math.round(file.size / 1024)} KB</span>
                </div>
            )}
        </div>
    );
}
