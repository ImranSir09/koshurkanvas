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

  shareFile(options: {
    data: string;
    fileName: string;
    mimeType?: string;
    title?: string;
    text?: string;
  }): Promise<{ success: boolean }>;
}

export const NativeMediaExport = registerPlugin<KashurMediaExportPluginInterface>('KashurMediaExport');

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
  dataUrlOrText: string,
  fileName: string,
  customMimeType?: string
): Promise<{ success: boolean; path?: string; message?: string }> {
  const mimeType = customMimeType || getMimeTypeFromFileName(fileName);
  const isImage = mimeType.startsWith('image/');

  // 1. Try Native Capacitor Plugin
  if (isNativeAndroid()) {
    try {
      if (isImage) {
        const res = await NativeMediaExport.saveImageToGallery({
          data: dataUrlOrText,
          fileName,
          mimeType,
          album: 'KoshurKanvas',
        });
        return {
          success: true,
          path: res.path || `Pictures/KoshurKanvas/${fileName}`,
          message: 'Saved to Pictures/KoshurKanvas',
        };
      } else {
        const res = await NativeMediaExport.saveDocumentToStorage({
          data: dataUrlOrText,
          fileName,
          mimeType,
          folder: 'KoshurKanvas',
        });
        return {
          success: true,
          path: res.path || `Downloads/KoshurKanvas/${fileName}`,
          message: 'Saved to Downloads/KoshurKanvas',
        };
      }
    } catch (pluginErr) {
      console.warn('Capacitor NativeMediaExport error, trying JsInterface fallback:', pluginErr);
    }

    // 2. Try WebView JS Interface fallback
    try {
      const jsInterface = (window as any).KashurNativeExport;
      if (jsInterface) {
        if (isImage && typeof jsInterface.saveImage === 'function') {
          const uri = jsInterface.saveImage(dataUrlOrText, fileName, mimeType);
          if (uri) {
            return {
              success: true,
              path: `Pictures/KoshurKanvas/${fileName}`,
              message: 'Saved to Pictures/KoshurKanvas',
            };
          }
        } else if (!isImage && typeof jsInterface.saveDocument === 'function') {
          const uri = jsInterface.saveDocument(dataUrlOrText, fileName, mimeType);
          if (uri) {
            return {
              success: true,
              path: `Downloads/KoshurKanvas/${fileName}`,
              message: 'Saved to Downloads/KoshurKanvas',
            };
          }
        }
      }
    } catch (jsErr) {
      console.warn('JsInterface save failed:', jsErr);
    }
  }

  // 3. Web browser standard fallback
  if (typeof document !== 'undefined') {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrlOrText;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, message: 'Download initiated' };
  }

  return { success: false, message: 'Unable to save file in current environment' };
}

/**
 * Shares files via native Android FileProvider / Intent chooser or Web Share API
 */
export async function shareFileNative(
  dataUrl: string,
  fileName: string,
  title: string = 'Kashur Kanvas',
  text: string = 'Created with Kashur Kanvas'
): Promise<boolean> {
  const mimeType = getMimeTypeFromFileName(fileName);

  // 1. Try Native Android Plugin
  if (isNativeAndroid()) {
    try {
      await NativeMediaExport.shareFile({
        data: dataUrl,
        fileName,
        mimeType,
        title,
        text,
      });
      return true;
    } catch (e) {
      console.warn('Native share failed, falling back to Web Share API:', e);
    }
  }

  // 2. Try Web Share API with File
  try {
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
