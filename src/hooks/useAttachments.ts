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
    isLoading?: boolean;
  }[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!selectedModel) {
      toast.error("Select a model first");
      return;
    }
    
    if (isProcessing) {
      toast.error("Please wait, images are still being processed");
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
    
    // First, create loading placeholders for images
    const loadingPlaceholders: typeof attachments = [];
    for (const p of paths) {
      const fileName = (p as string).split(/[\\/]/).pop() || "file";
      const mimeType = extToMime(fileName);
      const isImage = mimeType.startsWith("image/");
      const isGemini = selectedModel?.provider === "Gemini";
      
      if (isImage && !supportsImages && !isGemini) {
        toast.error("This model doesn't support image input");
        continue;
      }
      
      if (isImage) {
        // Create a loading placeholder for images
        const placeholderId = crypto.randomUUID();
        loadingPlaceholders.push({
          id: placeholderId,
          fileName: fileName.replace(/\.[^.]*$/, '.jpg'),
          mimeType: "image/jpeg",
          base64: "",
          bytes: new Uint8Array(),
          size: 0,
          url: undefined,
          isLoading: true,
        });
      }
      
      if (attachments.length + loadingPlaceholders.length >= 2) break;
    }
    
    // Add loading placeholders immediately
    if (loadingPlaceholders.length > 0) {
      setAttachments(prev => [...prev, ...loadingPlaceholders].slice(0, 2));
      setIsProcessing(true);
    }
    
    // Process files asynchronously
    const processFile = async (path: string, placeholderId?: string) => {
      try {
        const fileName = (path as string).split(/[\\/]/).pop() || "file";
        const mimeType = extToMime(fileName);
        const isImage = mimeType.startsWith("image/");
        
        let base64: string;
        let finalMimeType = mimeType;
        
        if (isImage) {
          // Use the optimized image function (now async)
          base64 = await invoke<string>("read_and_optimize_image", { filePath: path });
          finalMimeType = "image/jpeg";
        } else {
          // Use regular file reading for non-images
          base64 = await invoke<string>("read_and_encode_file", { filePath: path });
        }
        
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        
        const processedAttachment = {
          id: placeholderId || crypto.randomUUID(),
          fileName: isImage ? fileName.replace(/\.[^.]*$/, '.jpg') : fileName,
          mimeType: finalMimeType,
          base64,
          bytes,
          size: bytes.byteLength,
          url: isImage ? URL.createObjectURL(new Blob([bytes], { type: finalMimeType })) : undefined,
          isLoading: false,
        };
        
        // Update the specific attachment
        setAttachments(prev => 
          prev.map(att => 
            att.id === placeholderId ? processedAttachment : att
          )
        );
        
        return processedAttachment;
        
      } catch (err) {
        console.error("Failed reading file:", err);
        toast.error(`Failed to load ${(path as string).split(/[\\/]/).pop()}`);
        
        // Remove the failed attachment
        if (placeholderId) {
          setAttachments(prev => prev.filter(att => att.id !== placeholderId));
        }
        return null;
      }
    };
    
    // Process all files
    const processingPromises: Promise<any>[] = [];
    let placeholderIndex = 0;
    
    for (const p of paths) {
      const fileName = (p as string).split(/[\\/]/).pop() || "file";
      const mimeType = extToMime(fileName);
      const isImage = mimeType.startsWith("image/");
      const isGemini = selectedModel?.provider === "Gemini";
      
      if (isImage && !supportsImages && !isGemini) {
        continue;
      }
      
      const placeholderId = isImage && placeholderIndex < loadingPlaceholders.length 
        ? loadingPlaceholders[placeholderIndex++]?.id 
        : undefined;
        
      processingPromises.push(processFile(p, placeholderId));
      
      if (attachments.length + processingPromises.length >= 2) break;
    }
    
    // Wait for all processing to complete
    try {
      await Promise.all(processingPromises);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return { attachments, handleFileUpload, removeAttachment, setAttachments, isProcessing };
}
