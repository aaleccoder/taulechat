import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uint8ToBase64(u8: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

export function getBase64FromData(data: Uint8Array | string): string {
  if (typeof data === 'string') {
    // Check if it's a JSON array string representation like "[255,216,255,224,...]"
    if (data.startsWith('[') && data.endsWith(']')) {
      try {
        const byteArray = JSON.parse(data);
        if (Array.isArray(byteArray)) {
          const uint8Array = new Uint8Array(byteArray);
          return uint8ToBase64(uint8Array);
        }
      } catch (e) {
        console.error('Failed to parse byte array string:', e);
        throw new Error('Invalid byte array format');
      }
    }
    
    // If it's already a string, assume it's base64 or extract from data URL
    if (data.startsWith('data:')) {
      return data.split(',')[1] || data;
    }
    // Validate base64 and clean it
    try {
      // Remove any invalid characters and whitespace
      const cleanData = data.replace(/[^A-Za-z0-9+/=]/g, '');
      // Test if it's valid base64
      atob(cleanData);
      return cleanData;
    } catch (e) {
      console.warn('Invalid base64 data, trying to re-encode:', e);
      // If it's not valid base64, try to encode it as binary data
      return btoa(data);
    }
  }
  // Convert Uint8Array to base64
  return uint8ToBase64(data);
}

export function getDataUrl(data: Uint8Array | string, mimeType: string): string {
  try {
    if (typeof data === 'string' && data.startsWith('data:')) {
      return data; // Already a data URL
    }
    
    const base64 = getBase64FromData(data);
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    // Validate the data URL by checking base64 format
    if (!base64 || base64.length === 0) {
      throw new Error('Empty base64 data');
    }
    
    return dataUrl;
  } catch (error) {
    console.error('Error creating data URL:', error);
    console.error('Data type:', typeof data);
    console.error('Data sample:', typeof data === 'string' ? data.substring(0, 100) + '...' : 'Uint8Array');
    // Return a placeholder or empty data URL
    return `data:${mimeType};base64,`;
  }
}
