import { registerPlugin, Capacitor } from '@capacitor/core';

export interface KashurMediaExportPluginInterface {
  saveImageToGallery(options: {
    data: string;
    fileName: string;
    mimeType?: string;
    album?: string;
  }): Promise<{ success: boolean; uri: string; fileName: string; path: string }>;

  saveDocumentToStorage(options: {
    data: string;
    fileName: string;
    mimeType?: string;
    folder?: string;
  }): Promise<{ success: boolean; uri: string; fileName: string; path: string }>;

  saveWithSAF(options: {
    data: string;
    fileName: string;
    mimeType?: string;
  }): Promise<{ success: boolean; uri: string }>;

  shareFile(options: {
    data: string;
    fileName: string;
    mimeType?: string;
    title?: string;
    text?: string;
  }): Promise<{ success: boolean; uri?: string }>;
}

export const NativeMediaExport = registerPlugin<KashurMediaExportPluginInterface>('KashurMediaExport');

/**
 * Ensures any input (data URL, raw string, Blob, ArrayBuffer, or blob: / http: URL) is converted
 * to a standard Data URL before sending to native Android plugins.
 */
export async function ensureDataUrl(input: string | Blob | ArrayBuffer): Promise<string> {
  if (input instanceof ArrayBuffer) {
    const blob = new Blob([input]);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read ArrayBuffer as Data URL'));
      reader.readAsDataURL(blob);
    });
  }

  if (input instanceof Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read Blob as Data URL'));
      reader.readAsDataURL(input);
    });
  }

  if (typeof input === 'string') {
    if (input.startsWith('blob:') || input.startsWith('http://') || input.startsWith('https://')) {
      const res = await fetch(input);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to convert URL to Data URL'));
        reader.readAsDataURL(blob);
      });
    }
    return input;
  }

  throw new Error('Unsupported input type for file export');
}

/**
 * Checks if the current environment is running inside native Android/Capacitor
 */
export function isNativeAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  if (Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android') {
    return true;
  }
  if ((window as any).KashurNativeExport && (window as any).KashurNativeExport.isNative?.()) {
    return true;
  }
  return false;
}

/**
 * Returns MIME type based on file extension
 */
export function getMimeTypeFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'svg':
      return 'image/svg+xml';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'txt':
      return 'text/plain;charset=utf-8';
    case 'json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Saves exported files (images, PDFs, documents) to public user-accessible Android storage.
 * - Images (PNG, JPG, SVG) -> MediaStore.Images.Media (Pictures/KoshurKanvas)
 * - Documents (PDF, DOC, TXT) -> MediaStore.Downloads (Downloads/KoshurKanvas)
 * - Web fallback: Triggers standard browser download
 */
export async function saveExportToPublicStorage(
  dataUrlOrBlob: string | Blob | ArrayBuffer,
  fileName: string,
  customMimeType?: string
): Promise<{ success: boolean; path?: string; uri?: string; message?: string }> {
  const mimeType = customMimeType || getMimeTypeFromFileName(fileName);
  const isImage = mimeType.startsWith('image/');

  try {
    const dataUrl = await ensureDataUrl(dataUrlOrBlob);
    if (!dataUrl || dataUrl.trim().length === 0) {
      return { success: false, message: 'Export generated empty data' };
    }

    // 1. Try Native Capacitor Plugin
    if (isNativeAndroid()) {
      try {
        if (isImage) {
          const res = await NativeMediaExport.saveImageToGallery({
            data: dataUrl,
            fileName,
            mimeType,
            album: 'KoshurKanvas',
          });
          if (res && res.success && res.uri) {
            return {
              success: true,
              uri: res.uri,
              path: res.path || `Pictures/KoshurKanvas/${fileName}`,
              message: `Saved to Pictures/KoshurKanvas/${fileName}`,
            };
          }
        } else {
          const res = await NativeMediaExport.saveDocumentToStorage({
            data: dataUrl,
            fileName,
            mimeType,
            folder: 'KoshurKanvas',
          });
          if (res && res.success && res.uri) {
            return {
              success: true,
              uri: res.uri,
              path: res.path || `Downloads/KoshurKanvas/${fileName}`,
              message: `Saved to Downloads/KoshurKanvas/${fileName}`,
            };
          }
        }
      } catch (pluginErr: any) {
        console.warn('Capacitor NativeMediaExport error, trying JsInterface fallback:', pluginErr);
      }

      // 2. Try WebView JS Interface fallback
      try {
        const jsInterface = (window as any).KashurNativeExport;
        if (jsInterface) {
          if (isImage && typeof jsInterface.saveImage === 'function') {
            const uriStr = jsInterface.saveImage(dataUrl, fileName, mimeType);
            if (uriStr) {
              return {
                success: true,
                uri: uriStr,
                path: `Pictures/KoshurKanvas/${fileName}`,
                message: `Saved to Pictures/KoshurKanvas/${fileName}`,
              };
            }
          } else if (!isImage && typeof jsInterface.saveDocument === 'function') {
            const uriStr = jsInterface.saveDocument(dataUrl, fileName, mimeType);
            if (uriStr) {
              return {
                success: true,
                uri: uriStr,
                path: `Downloads/KoshurKanvas/${fileName}`,
                message: `Saved to Downloads/KoshurKanvas/${fileName}`,
              };
            }
          }
        }
      } catch (jsErr: any) {
        console.warn('JsInterface save failed:', jsErr);
      }
    }

    // 3. Web browser standard fallback
    if (typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true, message: 'Download initiated' };
    }
  } catch (err: any) {
    console.error('saveExportToPublicStorage error:', err);
    return { success: false, message: err?.message || 'Failed to save export' };
  }

  return { success: false, message: 'Unable to save file in current environment' };
}

/**
 * Shares files via native Android FileProvider / Intent chooser or Web Share API
 */
export async function shareFileNative(
  dataUrlOrBlob: string | Blob | ArrayBuffer,
  fileName: string,
  title: string = 'Kashur Kanvas',
  text: string = 'Created with Kashur Kanvas'
): Promise<boolean> {
  const mimeType = getMimeTypeFromFileName(fileName);

  try {
    const dataUrl = await ensureDataUrl(dataUrlOrBlob);
    if (!dataUrl || dataUrl.trim().length === 0) return false;

    // 1. Try Native Android Plugin
    if (isNativeAndroid()) {
      try {
        const res = await NativeMediaExport.shareFile({
          data: dataUrl,
          fileName,
          mimeType,
          title,
          text,
        });
        if (res && res.success) {
          return true;
        }
      } catch (e) {
        console.warn('Native share failed, falling back to Web Share API:', e);
      }
    }

    // 2. Try Web Share API with File
    if (typeof navigator !== 'undefined' && navigator.share) {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: mimeType });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title,
          text,
          files: [file],
        });
        return true;
      } else {
        await navigator.share({
          title,
          text,
          url: window.location.href,
        });
        return true;
      }
    }
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.warn('Web Share API error:', err);
    }
  }

  return false;
}

