import { useState } from "react";
import { toast } from "sonner";
import { open as openFile } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

interface FileEntry {
  path: string;
  name?: string;
}

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
      toast.error("Please wait, files are still being processed");
      return;
    }
    
    const files = await openFile({ 
      multiple: true, 
      directory: false,
      filters: [
        {
          name: 'Images and PDFs',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf']
        }
      ]
    });
    const fileEntries: (string | FileEntry)[] = Array.isArray(files) ? files : files ? [files] : [];
    if (fileEntries.length === 0) return;
    
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
    const isGemini = selectedModel?.provider === "Gemini";
    const isOpenRouter = selectedModel?.provider === "OpenRouter";
    
    // Count existing PDFs
    const existingPdfCount = attachments.filter(att => att.mimeType === "application/pdf").length;
    
    const loadingPlaceholders: typeof attachments = [];
    for (const entry of fileEntries) {
      const path = typeof entry === 'object' && entry.path ? entry.path : entry as string;
      const fileName = (typeof entry === 'object' && entry.name) ? entry.name : path.split(/[\\/]/).pop() || "file";
      const mimeType = extToMime(fileName);
      const isImage = mimeType.startsWith("image/");
      const isPdf = mimeType === "application/pdf";
      
      // Check image support
      if (isImage && !supportsImages && !isGemini) {
        toast.error("This model doesn't support image input");
        continue;
      }
      
      // Check PDF support and limits
      if (isPdf) {
        if (!isGemini && !isOpenRouter) {
          toast.error("PDF files are only supported by Gemini and OpenRouter models");
          continue;
        }
        
        if (isOpenRouter && (existingPdfCount > 0 || attachments.some(a => a.mimeType === "application/pdf"))) {
          toast.error("OpenRouter models support only one PDF file at a time");
          continue;
        }
        
        if (isGemini && existingPdfCount >= 10) {
          toast.error("Gemini models support up to 10 PDF files (max 1000 pages total)");
          continue;
        }
        
        if (isOpenRouter && existingPdfCount === 0) {
          toast.info("OpenRouter will process this PDF once and reuse it in future messages to optimize performance.", {
            duration: 4000
          });
        }
      }

      if (isImage || isPdf) {
        const placeholderId = crypto.randomUUID();
        loadingPlaceholders.push({
          id: placeholderId,
          fileName: fileName,
          mimeType: mimeType,
          base64: "",
          bytes: new Uint8Array(),
          size: 0,
          url: undefined,
          isLoading: true,
        });
      }
      
      // For OpenRouter, limit to 2 total files (including PDFs and images)
      // For Gemini, limit to reasonable number but allow more PDFs
      const maxFiles = isOpenRouter ? 2 : (isGemini ? 12 : 2);
      if (attachments.length + loadingPlaceholders.length >= maxFiles) break;
    }
    
    if (loadingPlaceholders.length > 0) {
      const maxAllowed = isOpenRouter ? 2 : (isGemini ? 12 : 2);
      setAttachments(prev => [...prev, ...loadingPlaceholders].slice(0, maxAllowed));
      setIsProcessing(true);
    }
    
    const processFile = async (entry: string | FileEntry, placeholderId?: string) => {
      const path = typeof entry === 'object' && entry.path ? entry.path : entry as string;
      const fileName = (typeof entry === 'object' && entry.name) ? entry.name : path.split(/[\\/]/).pop() || "file";
      
      try {
        const mimeType = extToMime(fileName);
        const isImage = mimeType.startsWith("image/");
        const isPdf = mimeType === "application/pdf";
        
        let base64: string;
        let finalMimeType = mimeType;
        
        if (isImage) {
          base64 = await invoke<string>("read_and_optimize_image", { filePath: path });
        } else {
          base64 = await invoke<string>("read_and_encode_file", { filePath: path });
        }
        
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        
        // Check PDF file size (warn if too large, as it might exceed context)
        if (isPdf && bytes.byteLength > 50 * 1024 * 1024) { // 50MB
          toast.warning("Large PDF file detected. It may exceed the model's context limit.");
        }
        
        const processedAttachment = {
          id: placeholderId || crypto.randomUUID(),
          fileName: fileName,
          mimeType: finalMimeType,
          base64,
          bytes,
          size: bytes.byteLength,
          url: isImage ? URL.createObjectURL(new Blob([bytes], { type: finalMimeType })) : undefined,
          isLoading: false,
        };
        
        setAttachments(prev => 
          prev.map(att => 
            att.id === placeholderId ? processedAttachment : att
          )
        );
        
        return processedAttachment;
        
      } catch (err) {
        console.error("Failed reading file:", err);
        const fileType = extToMime(fileName);
        const errorMessage = fileType === "application/pdf" 
          ? `The PDF file is not supported or is too large: ${fileName}`
          : `The file is not supported or is too large: ${fileName}`;
        toast.error(errorMessage);
        
        if (placeholderId) {
          setAttachments(prev => prev.filter(att => att.id !== placeholderId));
        }
        return null;
      }
    };
    
    const processingPromises: Promise<any>[] = [];
    let placeholderIndex = 0;
    
    for (const entry of fileEntries) {
      const path = typeof entry === 'object' && entry.path ? entry.path : entry as string;
      const fileName = (typeof entry === 'object' && entry.name) ? entry.name : path.split(/[\\/]/).pop() || "file";
      const mimeType = extToMime(fileName);
      const isImage = mimeType.startsWith("image/");
      const isPdf = mimeType === "application/pdf";
      
      // Skip files that don't meet requirements
      if (isImage && !supportsImages && !isGemini) {
        continue;
      }
      
      if (isPdf && !isGemini && !isOpenRouter) {
        continue;
      }
      
      const placeholderId = (isImage || isPdf) && placeholderIndex < loadingPlaceholders.length 
        ? loadingPlaceholders[placeholderIndex++]?.id 
        : undefined;
        
      processingPromises.push(processFile(entry, placeholderId));
      
      const maxFiles = isOpenRouter ? 2 : (isGemini ? 12 : 2);
      if (attachments.length + processingPromises.length >= maxFiles) break;
    }
    
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
