import { useEffect, useState } from "react";
import { getDataUrl } from "@/lib/utils";

export function useFilePreview(file: { mime_type: string; data: Uint8Array | string }) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const isImage = file.mime_type.startsWith("image/");

  useEffect(() => {
    if (!isImage || !file.data) {
      setPreviewUrl(undefined);
      return;
    }

    try {
      const dataUrl = getDataUrl(file.data, file.mime_type);
      setPreviewUrl(dataUrl);
    } catch (e) {
      console.error("Error creating file preview:", e);
      setPreviewUrl(undefined);
    }
  }, [file.data, file.mime_type, isImage]);

  return { previewUrl, isImage };
}
