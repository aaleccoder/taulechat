import { useEffect, useState } from "react";

export function useFilePreview(file: { mime_type: string; data: any }) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const isImage = file.mime_type.startsWith("image/");

  useEffect(() => {
    if (!isImage) return;
    let url: string | undefined;
    try {
      let byteCharacters = file.data;
      if (typeof byteCharacters === "string") {
        byteCharacters = JSON.parse(byteCharacters);
      }
      // @ts-ignore
      const blob = new Blob([new Uint8Array(byteCharacters)], { type: file.mime_type });
      url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (e) {
      setPreviewUrl(undefined);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file.data, file.mime_type, isImage]);

  return { previewUrl, isImage };
}
