import { useState } from "react";
import { toast } from "sonner";
import { open as openFile } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

export function useAttachments(selectedModel: any) {
  const [attachments, setAttachments] = useState<{
    id: string;
    fileName: string;
    mimeType: string;
    base64: string;
    bytes: Uint8Array;
    size: number;
    url?: string;
  }[]>([]);

  const handleFileUpload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!selectedModel) {
      toast.error("Select a model first");
      return;
    }
    const files = await openFile({ multiple: true, directory: false });
    const paths = Array.isArray(files) ? files : files ? [files] : [];
    if (paths.length === 0) return;
    const extToMime = (name: string) => {
      const lower = name.toLowerCase();
      if (/\.png|\.apng$/.test(lower)) return "image/png";
      if (/\.jpe?g$/.test(lower)) return "image/jpeg";
      if (/\.gif$/.test(lower)) return "image/gif";
      if (/\.webp$/.test(lower)) return "image/webp";
      if (/\.svg$/.test(lower)) return "image/svg+xml";
      if (/\.pdf$/.test(lower)) return "application/pdf";
      if (/\.txt$/.test(lower)) return "text/plain";
      if (/\.md$/.test(lower)) return "text/markdown";
      if (/\.json$/.test(lower)) return "application/json";
      return "application/octet-stream";
    };
    const supportsImages = !!selectedModel?.architecture?.input_modalities?.includes("image");
    const newly: typeof attachments = [];
    for (const p of paths) {
      try {
        const base64 = await invoke<string>("read_and_encode_file", { filePath: p });
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const fileName = (p as string).split(/[/\\]/).pop() || "file";
        const mimeType = extToMime(fileName);
        const isImage = mimeType.startsWith("image/");
        const isGemini = selectedModel?.provider === "Gemini";
        if (isImage && !supportsImages && !isGemini) {
          toast.error("This model doesn't support image input");
          continue;
        }
        newly.push({
          id: crypto.randomUUID(),
          fileName,
          mimeType,
          base64,
          bytes,
          size: bytes.byteLength,
          url: isImage ? URL.createObjectURL(new Blob([bytes], { type: mimeType })) : undefined,
        });
      } catch (err) {
        console.error("Failed reading file:", err);
        toast.error("Failed to load file");
      }
      if (attachments.length + newly.length >= 2) break;
    }
    const next = [...attachments, ...newly].slice(0, 2);
    setAttachments(next);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return { attachments, handleFileUpload, removeAttachment, setAttachments };
}
