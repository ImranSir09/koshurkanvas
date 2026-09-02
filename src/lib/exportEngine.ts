import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { CanvasAspectRatio, DocumentPaperSize, KashurDocument, TextStyleProperties, TextStyleSpan } from '../types/index';
import { getFontFamilyCSS } from './fontUtils';
import { buildRenderedSlices } from './textEngine';
import { DEFAULT_TEXT_STYLE } from './kashmiriData';
import { getCustomFontsCSS, getCustomFonts, loadSavedCustomFonts } from './customFonts';
import { saveExportToPublicStorage, shareFileNative, isNativeAndroid } from './nativeStorage';

export type ExportStageName = 'Preparing' | 'Rendering' | 'Encoding' | 'Saving' | 'Complete';

export interface ExportProgressDetails {
  sizeBytes?: number;
  dataUrl?: string;
  uri?: string;
  path?: string;
}

export interface ExportOptions {
  fileName: string;
  format: 'png' | 'jpeg' | 'pdf' | 'transparent_png' | 'svg' | 'doc' | 'txt' | 'share';
  pixelRatio?: number;
  quality?: number;
  aspectRatio?: CanvasAspectRatio;
  paperSize?: DocumentPaperSize;
  orientation?: 'portrait' | 'landscape';
  includeBorder?: boolean;
  onProgress?: (stage: ExportStageName, percent: number, details?: ExportProgressDetails) => void;
  signal?: AbortSignal;
}

export function calculateDataUrlByteSize(dataUrl: string): number {
  if (!dataUrl) return 0;
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return dataUrl.length;
  const base64Str = dataUrl.slice(commaIdx + 1);
  const paddingMatches = base64Str.match(/=/g);
  const padding = paddingMatches ? paddingMatches.length : 0;
  return Math.floor((base64Str.length * 3) / 4) - padding;
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return 'Calculating size...';
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let cachedFontEmbedCSS: string | null = null;
let fontLoadingPromise: Promise<string> | null = null;

/**
 * Inlines all font url(...) references in CSS text as base64 data URIs.
 */
async function inlineFontFaceUrls(cssText: string): Promise<string> {
  const matches = Array.from(cssText.matchAll(/url\((['"]?)([^'")]+)\1\)/g));
  if (matches.length === 0) return cssText;
  let result = cssText;
  const urlToDataMap = new Map<string, string>();

  await Promise.allSettled(
    matches.map(async (m) => {
      const rawUrl = m[2];
      if (!rawUrl || rawUrl.startsWith('data:') || urlToDataMap.has(rawUrl)) return;
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 1200);
        const res = await fetch(rawUrl, { signal: ctrl.signal });
        clearTimeout(timeout);
        if (!res.ok) return;
        const blob = await res.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        if (base64 && base64.startsWith('data:')) {
          urlToDataMap.set(rawUrl, base64);
        }
      } catch {
        // Fallback gracefully
      }
    })
  );

  for (const [url, dataUri] of urlToDataMap.entries()) {
    result = result.split(url).join(dataUri);
  }
  return result;
}

/**
 * Extracts and prepares embedded base64 CSS for Noto Nastaliq Urdu, Gulzar, Amiri,
 * Noto Sans Arabic, Plus Jakarta Sans, and all user-uploaded custom fonts.
 */
export async function getBase64FontEmbedCSS(): Promise<string> {
  if (cachedFontEmbedCSS) return cachedFontEmbedCSS;
  if (fontLoadingPromise) return fontLoadingPromise;

  fontLoadingPromise = (async () => {
    let combinedCSS = '';

    // 1. Extract existing @font-face rules from loaded document stylesheets and inline font binaries
    try {
      if (typeof document !== 'undefined') {
        for (let i = 0; i < document.styleSheets.length; i++) {
          const sheet = document.styleSheets[i];
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (!rules) continue;
            for (let j = 0; j < rules.length; j++) {
              const rule = rules[j];
              if (rule.type === CSSRule.FONT_FACE_RULE || (rule as any).cssText?.startsWith('@font-face')) {
                combinedCSS += rule.cssText + '\n';
              }
            }
          } catch {
            // Ignore CORS restricted cross-origin sheets
          }
        }
      }
    } catch (e) {
      console.warn('Stylesheet font extraction warning:', e);
    }

    if (combinedCSS.length > 0) {
      combinedCSS = await inlineFontFaceUrls(combinedCSS);
    }

    // 2. Fetch Google Fonts CSS with base64 embedded binary files if not already cached
    try {
      const fontCssUrl =
        'https://fonts.googleapis.com/css2?family=Gulzar&family=Noto+Nastaliq+Urdu:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Amiri:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800);

      const res = await fetch(fontCssUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        let cssText = await res.text();
        cssText = await inlineFontFaceUrls(cssText);
        combinedCSS += '\n' + cssText;
      }
    } catch {
      // Fallback gracefully without delay
    }

    cachedFontEmbedCSS = combinedCSS;
    return combinedCSS + '\n' + getCustomFontsCSS();
  })();

  const baseCSS = await fontLoadingPromise;
  return baseCSS + '\n' + getCustomFontsCSS();
}

// Pre-warm font cache
if (typeof window !== 'undefined') {
  setTimeout(() => {
    getBase64FontEmbedCSS().catch(() => {});
  }, 300);
}

/**
 * Ensures all document web fonts are fully ready before initiating export
 */
export async function ensureFontsReady(doc?: KashurDocument): Promise<boolean> {
  if (typeof document === 'undefined' || !document.fonts) return true;
  try {
    await document.fonts.ready;
    let customFonts = getCustomFonts();
    if (customFonts.length === 0) {
      await loadSavedCustomFonts().catch(() => []);
      customFonts = getCustomFonts();
    }

    const fontFamilies = new Set<string>([
      'Noto Nastaliq Urdu',
      'Gulzar',
      'Amiri',
      'Noto Sans Arabic',
      'Plus Jakarta Sans',
      ...customFonts.map((cf) => cf.name),
    ]);

    if (doc) {
      if (doc.defaultStyle?.fontFamily) fontFamilies.add(doc.defaultStyle.fontFamily);
      doc.textLayers?.forEach((l) => {
        if (l.style?.fontFamily) fontFamilies.add(l.style.fontFamily);
        l.spans?.forEach((s) => {
          if (s.style?.fontFamily) fontFamilies.add(s.style.fontFamily);
        });
      });
      doc.spans?.forEach((s) => {
        if (s.style?.fontFamily) fontFamilies.add(s.style.fontFamily);
      });
    }

    const weights = ['400', '500', '600', '700'];
    const fontsToCheck: string[] = [];
    fontFamilies.forEach((f) => {
      weights.forEach((w) => {
        fontsToCheck.push(`${w} 24px "${f}"`);
        fontsToCheck.push(`italic ${w} 24px "${f}"`);
      });
    });

    await Promise.allSettled(fontsToCheck.map((f) => document.fonts.load(f)));
    await document.fonts.ready;
    return true;
  } catch (err) {
    console.warn('Font loading check notice:', err);
    return false;
  }
}

/**
 * Pre-loads all images in the document to ensure 100% complete rasterization
 */
export async function preloadImages(imageUrls: string[]): Promise<void> {
  const validUrls = imageUrls.filter((url) => url && typeof url === 'string' && url.trim().length > 0);
  if (validUrls.length === 0) return;

  await Promise.allSettled(
    validUrls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
          if (img.complete) resolve();
        })
    )
  );
}

export function getAspectRatioNumeric(
  ratio?: CanvasAspectRatio,
  orientation: 'portrait' | 'landscape' = 'portrait'
): number {
  if (!ratio || ratio === 'auto') return 1.0;
  const isLand = orientation === 'landscape';

  switch (ratio) {
    case 'a3':
    case 'a4':
    case 'a5':
    case 'a6':
    case 'b4':
    case 'b5':
    case 'b6':
      return isLand ? 1.41421356 : 1 / 1.41421356;
    case 'letter':
      return isLand ? 11 / 8.5 : 8.5 / 11;
    case 'legal':
      return isLand ? 14 / 8.5 : 8.5 / 14;
    case 'tabloid':
      return isLand ? 17 / 11 : 11 / 17;
    case '1:1':
      return 1.0;
    case '4:5':
      return isLand ? 5 / 4 : 4 / 5;
    case '9:16':
      return isLand ? 16 / 9 : 9 / 16;
    case '16:9':
      return 16 / 9;
    case '3:4':
      return isLand ? 4 / 3 : 3 / 4;
    case '2:3':
      return isLand ? 3 / 2 : 2 / 3;
    default:
      return 1.0;
  }
}

export function getPaperDimensionsInPt(
  paperSize: DocumentPaperSize = 'a4',
  orientation: 'portrait' | 'landscape' = 'portrait'
): [number, number] {
  let w = 595.28;
  let h = 841.89;

  switch (paperSize) {
    case 'a3':
      w = 841.89;
      h = 1190.55;
      break;
    case 'a4':
      w = 595.28;
      h = 841.89;
      break;
    case 'a5':
      w = 419.53;
      h = 595.28;
      break;
    case 'a6':
      w = 297.64;
      h = 419.53;
      break;
    case 'letter':
      w = 612.0;
      h = 792.0;
      break;
    case 'legal':
      w = 612.0;
      h = 1008.0;
      break;
    case 'tabloid':
      w = 792.0;
      h = 1224.0;
      break;
    case 'b4':
      w = 708.66;
      h = 1000.63;
      break;
    case 'b5':
      w = 498.9;
      h = 708.66;
      break;
    case 'b6':
      w = 354.33;
      h = 498.9;
      break;
  }

  if (orientation === 'landscape') {
    return [Math.max(w, h), Math.min(w, h)];
  }
  return [Math.min(w, h), Math.max(w, h)];
}

/**
 * Canvas reference stage dimensions for editing coordinate space
 */
export function getCanvasRefDimensions(
  aspectRatio?: CanvasAspectRatio,
  orientation: 'portrait' | 'landscape' = 'portrait',
  customW?: number,
  customH?: number
): { refWidth: number; refHeight: number } {
  const isLandscape = orientation === 'landscape';

  if (aspectRatio === 'custom' && customW && customH) {
    const w = isLandscape ? Math.max(customW, customH) : customW;
    const h = isLandscape ? Math.min(customW, customH) : customH;
    return {
      refWidth: isLandscape ? 680 : 520,
      refHeight: Math.max(100, Math.round((isLandscape ? 680 : 520) * (h / w))),
    };
  }

  switch (aspectRatio) {
    case '1:1':
      return { refWidth: 520, refHeight: 520 };
    case '4:5':
      return isLandscape ? { refWidth: 575, refHeight: 460 } : { refWidth: 460, refHeight: 575 };
    case '9:16':
      return isLandscape ? { refWidth: 640, refHeight: 360 } : { refWidth: 360, refHeight: 640 };
    case '16:9':
      return { refWidth: 720, refHeight: 405 };
    case '3:4':
      return isLandscape ? { refWidth: 640, refHeight: 480 } : { refWidth: 480, refHeight: 640 };
    case '2:3':
      return isLandscape ? { refWidth: 640, refHeight: 426 } : { refWidth: 426, refHeight: 640 };
    case 'a3':
      return isLandscape ? { refWidth: 720, refHeight: 509 } : { refWidth: 509, refHeight: 720 };
    case 'a4':
      return isLandscape ? { refWidth: 680, refHeight: 480 } : { refWidth: 520, refHeight: 735 };
    case 'a5':
      return isLandscape ? { refWidth: 600, refHeight: 424 } : { refWidth: 424, refHeight: 600 };
    case 'a6':
      return isLandscape ? { refWidth: 640, refHeight: 450 } : { refWidth: 450, refHeight: 640 };
    case 'letter':
      return isLandscape ? { refWidth: 680, refHeight: 525 } : { refWidth: 525, refHeight: 680 };
    case 'legal':
      return isLandscape ? { refWidth: 720, refHeight: 437 } : { refWidth: 437, refHeight: 720 };
    case 'tabloid':
      return isLandscape ? { refWidth: 720, refHeight: 465 } : { refWidth: 465, refHeight: 720 };
    case 'b4':
    case 'b5':
    case 'b6':
      return isLandscape ? { refWidth: 640, refHeight: 450 } : { refWidth: 450, refHeight: 640 };
    case 'auto':
    default:
      return { refWidth: 620, refHeight: 480 };
  }
}

/**
 * Returns target export pixel dimensions and the base reference scale
 */
export function getExportResolutionDimensions(
  aspectRatio: CanvasAspectRatio = 'a4',
  orientation: 'portrait' | 'landscape' = 'portrait',
  customW?: number,
  customH?: number
): { width: number; height: number; refWidth: number; refHeight: number } {
  const { refWidth, refHeight } = getCanvasRefDimensions(aspectRatio, orientation, customW, customH);
  const isLand = orientation === 'landscape';

  if (aspectRatio === 'custom' && customW && customH) {
    const w = isLand ? Math.max(customW, customH) : customW;
    const h = isLand ? Math.min(customW, customH) : customH;
    return {
      width: w,
      height: h,
      refWidth,
      refHeight,
    };
  }

  switch (aspectRatio) {
    case '1:1':
      return { width: 1200, height: 1200, refWidth, refHeight };
    case '4:5':
      return { width: isLand ? 1350 : 1080, height: isLand ? 1080 : 1350, refWidth, refHeight };
    case '9:16':
      return { width: isLand ? 1920 : 1080, height: isLand ? 1080 : 1920, refWidth, refHeight };
    case '16:9':
      return { width: 1920, height: 1080, refWidth: 720, refHeight: 405 };
    case '3:4':
      return { width: isLand ? 1600 : 1200, height: isLand ? 1200 : 1600, refWidth, refHeight };
    case '2:3':
      return { width: isLand ? 1800 : 1200, height: isLand ? 1200 : 1800, refWidth, refHeight };
    case 'a3':
      return { width: isLand ? 2480 : 1754, height: isLand ? 1754 : 2480, refWidth, refHeight };
    case 'a4':
      return { width: isLand ? 1754 : 1240, height: isLand ? 1240 : 1754, refWidth, refHeight };
    case 'a5':
      return { width: isLand ? 1240 : 874, height: isLand ? 874 : 1240, refWidth, refHeight };
    case 'letter':
      return { width: isLand ? 1650 : 1275, height: isLand ? 1275 : 1650, refWidth, refHeight };
    case 'legal':
      return { width: isLand ? 2100 : 1275, height: isLand ? 1275 : 2100, refWidth, refHeight };
    case 'tabloid':
      return { width: isLand ? 2550 : 1650, height: isLand ? 1650 : 2550, refWidth, refHeight };
    case 'b4':
      return { width: isLand ? 2102 : 1488, height: isLand ? 1488 : 2102, refWidth, refHeight };
    case 'b5':
      return { width: isLand ? 1488 : 1050, height: isLand ? 1050 : 1488, refWidth, refHeight };
    case 'a6':
    case 'b6':
      return { width: isLand ? 1240 : 874, height: isLand ? 874 : 1240, refWidth, refHeight };
    case 'auto':
    default:
      return { width: 1240, height: 960, refWidth, refHeight };
  }
}

/**
 * Applies span and preset styles to a styled text element
 */
function applySliceStyleToElement(
  el: HTMLElement,
  style: Partial<TextStyleProperties>,
  scale: number
) {
  el.style.fontFamily = getFontFamilyCSS(style.fontFamily || 'Noto Nastaliq Urdu');
  el.style.fontSize = `${Math.max(12, Math.round((style.fontSize || 28) * scale))}px`;
  el.style.fontWeight = style.bold ? '700' : 'normal';
  el.style.fontStyle = style.italic ? 'italic' : 'normal';
  el.style.textDecoration = style.underline ? 'underline' : 'none';
  el.style.fontFeatureSettings = '"kern" 1, "liga" 1, "calt" 1';
  el.style.textRendering = 'optimizeLegibility';
  (el.style as any).webkitFontSmoothing = 'antialiased';
  el.style.unicodeBidi = 'isolate';

  if (style.gradient) {
    el.style.backgroundImage = style.gradient;
    (el.style as any).webkitBackgroundClip = 'text';
    (el.style as any).backgroundClip = 'text';
    (el.style as any).webkitTextFillColor = 'transparent';
    el.style.color = 'transparent';
  } else {
    el.style.color = style.color || '#1c1917';
  }

  if (style.highlightGradient) {
    el.style.backgroundImage = style.highlightGradient;
    el.style.borderRadius = `${Math.round(4 * scale)}px`;
    el.style.padding = `0 ${Math.round(4 * scale)}px`;
  } else if (style.highlightColor && style.highlightColor !== 'transparent') {
    el.style.backgroundColor = style.highlightColor;
    el.style.borderRadius = `${Math.round(4 * scale)}px`;
    el.style.padding = `0 ${Math.round(4 * scale)}px`;
  }

  if (style.letterSpacing) {
    el.style.letterSpacing = `${Math.round(style.letterSpacing * scale)}px`;
  }

  if (style.shadowColor) {
    const sx = Math.round((style.shadowOffsetX || 0) * scale);
    const sy = Math.round((style.shadowOffsetY || 2) * scale);
    const sb = Math.round((style.shadowBlur || 4) * scale);
    el.style.textShadow = `${sx}px ${sy}px ${sb}px ${style.shadowColor}`;
  }

  if (style.strokeColor && style.strokeWidth && style.strokeWidth > 0) {
    const sw = Math.max(1, Math.round(style.strokeWidth * scale));
    (el.style as any).webkitTextStroke = `${sw}px ${style.strokeColor}`;
    (el.style as any).paintOrder = 'stroke fill';
    (el.style as any).webkitPaintOrder = 'stroke fill';
  }
}

/**
 * Determines whether the export canvas background is predominantly dark.
 */
function isDarkBackground(
  color?: string,
  gradient?: string,
  image?: string,
  overlayOpacity?: number
): boolean {
  if (overlayOpacity && overlayOpacity > 0.45) return true;
  if (image && (image.includes('dark') || image.includes('night') || image.includes('black') || image.includes('emerald-950'))) return true;
  if (gradient) {
    const lower = gradient.toLowerCase();
    if (lower.includes('#0') || lower.includes('#1') || lower.includes('#2') || lower.includes('rgb(0') || lower.includes('rgb(1') || lower.includes('rgb(2')) {
      return true;
    }
  }
  if (!color) return false;
  const hex = color.replace('#', '').trim();
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 130;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 130;
  }
  return false;
}

/**
 * Creates the fixed subtle export watermark with the official uploaded app icon and "کٲشُرکنْواس" text.
 */
function createExportWatermarkElement(scale: number, isDark: boolean): HTMLElement {
  const container = document.createElement('div');
  container.id = 'export-fixed-watermark';
  container.dir = 'rtl';
  container.style.position = 'absolute';
  container.style.bottom = `${Math.max(8, Math.round(14 * scale))}px`;
  container.style.left = `${Math.max(10, Math.round(16 * scale))}px`;
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.gap = `${Math.max(4, Math.round(6 * scale))}px`;
  container.style.opacity = '0.35';
  container.style.zIndex = '10';
  container.style.pointerEvents = 'none';
  container.style.userSelect = 'none';

  const iconSize = Math.max(14, Math.round(18 * scale));
  const fontSize = Math.max(10, Math.round(13 * scale));
  const textColor = isDark ? '#ffffff' : '#1c1917';

  container.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${iconSize}" height="${iconSize}" style="border-radius: ${Math.max(2, Math.round(4 * scale))}px; flex-shrink: 0; display: block;" aria-hidden="true">
      <defs>
        <radialGradient id="wm_parchmentBg" cx="45%" cy="40%" r="65%">
          <stop offset="0%" stop-color="#FCFAF5" />
          <stop offset="60%" stop-color="#F5EFE3" />
          <stop offset="100%" stop-color="#ECE3D2" />
        </radialGradient>
        <linearGradient id="wm_goldChinar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFE898" />
          <stop offset="35%" stop-color="#DFAC38" />
          <stop offset="70%" stop-color="#C58C1B" />
          <stop offset="100%" stop-color="#8F5E0B" />
        </linearGradient>
        <linearGradient id="wm_goldStroke" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="#8F5E0B" stop-opacity="0.2" />
          <stop offset="30%" stop-color="#DFAC38" />
          <stop offset="70%" stop-color="#FFE898" />
          <stop offset="100%" stop-color="#B87F14" stop-opacity="0.8" />
        </linearGradient>
        <linearGradient id="wm_goldTrim" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFF0BA" />
          <stop offset="50%" stop-color="#DDA62F" />
          <stop offset="100%" stop-color="#885705" />
        </linearGradient>
        <linearGradient id="wm_royalBlueBrush" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#244E96" />
          <stop offset="40%" stop-color="#14346E" />
          <stop offset="85%" stop-color="#0B1F48" />
          <stop offset="100%" stop-color="#06122D" />
        </linearGradient>
        <linearGradient id="wm_navyTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#163772" />
          <stop offset="50%" stop-color="#0E244F" />
          <stop offset="100%" stop-color="#071533" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#wm_parchmentBg)" />
      <rect x="3" y="3" width="506" height="506" rx="109" fill="none" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="2.5" />
      <rect x="6" y="6" width="500" height="500" rx="106" fill="none" stroke="#DFCBB2" stroke-opacity="0.3" stroke-width="1.5" />
      <g transform="translate(0, -6)">
        <path d="M 188 268 C 240 274 300 248 335 220 C 310 238 250 258 200 248 Z" fill="url(#wm_goldStroke)" />
        <g>
          <path d="M 285 85 C 275 110, 260 115, 245 95 C 240 120, 215 125, 196 100 C 200 130, 180 145, 175 155 C 195 160, 205 180, 185 198 C 208 200, 222 215, 218 238 C 240 220, 260 215, 282 230 C 285 200, 310 185, 335 180 C 310 155, 320 130, 310 110 Z" fill="url(#wm_goldChinar)" />
          <path d="M 235 140 C 220 150, 212 170, 224 185 C 232 195, 248 195, 252 182 C 255 170, 240 162, 238 152 C 237 145, 245 138, 248 132 C 245 133, 238 135, 235 140 Z" fill="#FFF1C2" fill-opacity="0.6" stroke="#8C5C0B" stroke-width="1.2" />
          <path d="M 252 182 C 265 165, 275 140, 285 110" fill="none" stroke="#7A4E06" stroke-width="2.2" stroke-linecap="round" />
          <path d="M 268 150 C 285 145, 298 155, 305 162" fill="none" stroke="#7A4E06" stroke-width="1.5" stroke-linecap="round" />
          <path d="M 260 165 C 275 175, 285 188, 290 200" fill="none" stroke="#7A4E06" stroke-width="1.5" stroke-linecap="round" />
          <path d="M 242 165 C 220 155, 205 145, 195 135" fill="none" stroke="#7A4E06" stroke-width="1.5" stroke-linecap="round" />
          <path d="M 230 180 C 210 185, 200 195, 195 205" fill="none" stroke="#7A4E06" stroke-width="1.5" stroke-linecap="round" />
          <circle cx="232" cy="172" r="3" fill="#8C5C0B" />
          <circle cx="270" cy="130" r="2.5" fill="#8C5C0B" />
          <circle cx="288" cy="145" r="2.5" fill="#8C5C0B" />
          <circle cx="210" cy="165" r="2" fill="#8C5C0B" />
        </g>
        <g>
          <path d="M 218 238 C 230 195, 275 130, 336 108 C 334 140, 320 190, 292 230 C 272 258, 240 262, 218 238 Z" fill="url(#wm_royalBlueBrush)" />
          <path d="M 295 138 C 285 160, 270 185, 248 215" fill="none" stroke="url(#wm_goldTrim)" stroke-width="2.5" stroke-linecap="round" />
          <path d="M 288 152 C 300 162, 305 178, 298 190 C 290 182, 282 170, 288 152 Z" fill="url(#wm_goldTrim)" fill-opacity="0.8" />
          <path d="M 272 178 C 282 188, 285 202, 278 212 C 270 205, 265 192, 272 178 Z" fill="url(#wm_goldTrim)" fill-opacity="0.8" />
          <path d="M 255 202 C 263 210, 264 222, 258 230 C 252 224, 248 215, 255 202 Z" fill="url(#wm_goldTrim)" fill-opacity="0.8" />
          <path d="M 205 238 L 228 222 L 236 232 L 213 248 Z" fill="url(#wm_goldTrim)" stroke="#5A3A02" stroke-width="0.8" />
          <path d="M 213 248 C 205 255, 190 265, 185 266 C 192 258, 202 242, 205 238 Z" fill="#1E144D" stroke="url(#wm_goldTrim)" stroke-width="1.2" />
        </g>
      </g>
      <g transform="translate(0, 10)">
        <path d="M 345 272 C 335 272, 310 282, 292 305 C 292 288, 280 278, 268 285 C 255 292, 248 308, 240 320 C 230 335, 210 352, 185 358 C 160 365, 155 358, 172 346 C 195 330, 212 308, 222 285 C 225 278, 220 274, 212 280 C 198 290, 182 305, 168 322 C 152 342, 142 362, 158 368 C 178 375, 215 365, 245 338 C 255 330, 268 305, 280 295 C 288 290, 295 300, 292 315 C 288 335, 282 355, 280 370 C 285 372, 292 368, 296 355 C 305 328, 320 300, 342 290 C 350 286, 355 272, 345 272 Z" fill="url(#wm_navyTextGrad)" />
        <path d="M 338 270 C 315 285, 290 295, 265 300" fill="none" stroke="url(#wm_navyTextGrad)" stroke-width="7" stroke-linecap="round" />
        <circle cx="248" cy="275" r="4.5" fill="url(#wm_navyTextGrad)" />
        <circle cx="258" cy="264" r="4.5" fill="url(#wm_navyTextGrad)" />
        <circle cx="268" cy="275" r="4.5" fill="url(#wm_navyTextGrad)" />
        <path d="M 302 260 C 298 266, 290 272, 284 274" fill="none" stroke="url(#wm_navyTextGrad)" stroke-width="4.5" stroke-linecap="round" />
      </g>
      <g transform="translate(0, 15)">
        <text x="256" y="415" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="52" font-weight="800" letter-spacing="2.5" fill="url(#wm_navyTextGrad)" text-anchor="middle">kanvas</text>
      </g>
    </svg>
    <span style="font-family: 'Noto Nastaliq Urdu', 'Gulzar', 'Amiri', serif; font-size: ${fontSize}px; font-weight: 700; color: ${textColor}; line-height: 1.2; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; letter-spacing: 0.3px; white-space: nowrap;">کٲشُرکنْواس</span>
  `;

  return container;
}

/**
 * Creates an isolated off-screen clean DOM representation of the document.
 * This completely isolates the rendered content, excludes all editor UI/controls,
 * and maintains coordinates starting exactly at (0, 0) inside the export container.
 */
export function createCleanOffscreenDom(
  doc: KashurDocument,
  options: ExportOptions
): {
  wrapper: HTMLElement;
  container: HTMLElement;
  cleanup: () => void;
  width: number;
  height: number;
  hasRenderableContent: boolean;
} {
  const canvasConfig = doc.canvasConfig || {};
  const aspectRatio = options.aspectRatio || canvasConfig.aspectRatio || 'a4';
  const orientation = options.orientation || canvasConfig.orientation || 'portrait';
  const customW = canvasConfig.customWidth;
  const customH = canvasConfig.customHeight;

  const { width, height, refWidth } = getExportResolutionDimensions(
    aspectRatio,
    orientation,
    customW,
    customH
  );

  const scale = width / Math.max(1, refWidth);

  // 1. Offscreen Host Wrapper attached to document.body
  const wrapper = document.createElement('div');
  wrapper.id = 'kashur-export-offscreen-host';
  wrapper.setAttribute('aria-hidden', 'true');
  wrapper.style.position = 'fixed';
  wrapper.style.top = '0px';
  wrapper.style.left = '-25000px';
  wrapper.style.width = `${width}px`;
  wrapper.style.height = `${height}px`;
  wrapper.style.overflow = 'hidden';
  wrapper.style.opacity = '0';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.zIndex = '-99999';

  // 2. Export Stage Container (starts exactly at (0, 0) for SVG foreignObject)
  const container = document.createElement('div');
  container.id = 'kashur-clean-export-stage';
  container.style.position = 'relative';
  container.style.left = '0px';
  container.style.top = '0px';
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.minWidth = `${width}px`;
  container.style.minHeight = `${height}px`;
  container.style.maxWidth = `${width}px`;
  container.style.maxHeight = `${height}px`;
  container.style.boxSizing = 'border-box';
  container.style.overflow = 'hidden';
  container.style.margin = '0px';
  container.style.padding = '0px';
  if (options.format === 'transparent_png') {
    container.style.backgroundColor = 'transparent';
  } else if (canvasConfig.gradient) {
    container.style.background = canvasConfig.gradient;
  } else if (
    canvasConfig.image &&
    (canvasConfig.image.startsWith('linear-gradient') || canvasConfig.image.startsWith('radial-gradient'))
  ) {
    container.style.background = canvasConfig.image;
  } else {
    container.style.backgroundColor = canvasConfig.color || '#ffffff';
    if (canvasConfig.image) {
      container.style.backgroundImage = `url(${canvasConfig.image})`;
      container.style.backgroundSize = 'cover';
      container.style.backgroundPosition = 'center';
    }
  }

  // Canvas background overlay if configured
  if (
    canvasConfig.overlayOpacity &&
    canvasConfig.overlayOpacity > 0 &&
    options.format !== 'transparent_png'
  ) {
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0px';
    overlay.style.backgroundColor = canvasConfig.overlayColor || '#000000';
    overlay.style.opacity = `${canvasConfig.overlayOpacity}`;
    overlay.style.zIndex = '1';
    overlay.style.pointerEvents = 'none';
    container.appendChild(overlay);
  }

  // 3. Content Layer
  const contentLayer = document.createElement('div');
  contentLayer.style.position = 'relative';
  contentLayer.style.width = '100%';
  contentLayer.style.height = '100%';
  contentLayer.style.zIndex = '2';
  contentLayer.style.overflow = 'hidden';

  const rawLayers = doc.textLayers && doc.textLayers.length > 0 ? doc.textLayers : [];
  const visibleLayers = rawLayers.filter((l) => !l.isHidden);
  const hasTextInLayers = visibleLayers.some((l) => l.text && l.text.trim().length > 0);
  const hasTextInContent = !!(doc.content && doc.content.trim().length > 0);
  let hasRenderableContent = hasTextInLayers || hasTextInContent;

  if (hasTextInLayers) {
    // Sort layers by zIndex for proper depth order
    const sortedLayers = [...visibleLayers].sort((a, b) => (a.zIndex ?? 10) - (b.zIndex ?? 10));

    sortedLayers.forEach((layer) => {
      if (!layer.text && layer.type === 'text') return;

      const layerDiv = document.createElement('div');
      layerDiv.style.position = 'absolute';
      layerDiv.style.left = `${Math.round(layer.x * scale)}px`;
      layerDiv.style.top = `${Math.round(layer.y * scale)}px`;

      if (layer.width) {
        layerDiv.style.width = `${Math.round(layer.width * scale)}px`;
      } else {
        layerDiv.style.width = 'auto';
        layerDiv.style.maxWidth = `${width - Math.round(layer.x * scale) - 20}px`;
      }

      layerDiv.style.minWidth = `${Math.round(40 * scale)}px`;
      layerDiv.style.zIndex = `${layer.zIndex ?? 10}`;
      layerDiv.style.opacity = `${layer.opacity ?? 1}`;

      let transformStr = `rotate(${layer.rotation || 0}deg) scale(${layer.scale || 1})`;
      if (layer.style?.flipX) transformStr += ' scaleX(-1)';
      if (layer.style?.flipY) transformStr += ' scaleY(-1)';
      layerDiv.style.transform = transformStr;
      layerDiv.style.transformOrigin = 'center center';
      layerDiv.style.boxSizing = 'border-box';

      // Shape borders and highlights
      if (layer.style?.borderWidth && layer.style.borderWidth > 0) {
        layerDiv.style.borderWidth = `${Math.round(layer.style.borderWidth * scale)}px`;
        layerDiv.style.borderColor = layer.style.borderColor || '#000000';
        layerDiv.style.borderStyle = 'solid';
      } else {
        layerDiv.style.border = 'none';
      }
      if (layer.style?.borderRadius) {
        layerDiv.style.borderRadius = `${Math.round(layer.style.borderRadius * scale)}px`;
      }
      if (layer.style?.padding) {
        layerDiv.style.padding = `${Math.round(layer.style.padding * scale)}px`;
      }
      if (layer.style?.highlightGradient) {
        layerDiv.style.background = layer.style.highlightGradient;
      } else if (layer.style?.highlightColor && layer.style.highlightColor !== 'transparent') {
        layerDiv.style.backgroundColor = layer.style.highlightColor;
      }

      const textInner = document.createElement('div');
      textInner.dir = layer.style?.direction || 'rtl';
      textInner.style.fontFamily = getFontFamilyCSS(layer.style?.fontFamily || 'Noto Nastaliq Urdu');
      textInner.style.textAlign = layer.style?.align || 'center';
      textInner.style.lineHeight = `${layer.style?.lineHeight || 2.2}`;
      textInner.style.letterSpacing = `${Math.round((layer.style?.letterSpacing || 0) * scale)}px`;
      textInner.style.whiteSpace = 'pre-wrap';
      textInner.style.wordBreak = 'break-word';
      textInner.style.overflow = 'visible';
      textInner.style.width = '100%';
      textInner.style.boxSizing = 'border-box';
      textInner.style.opacity = `${layer.style?.opacity ?? 1}`;
      textInner.style.fontFeatureSettings = '"kern" 1, "liga" 1, "calt" 1';
      textInner.style.textRendering = 'optimizeLegibility';
      (textInner.style as any).webkitFontSmoothing = 'antialiased';
      textInner.style.unicodeBidi = 'isolate';

      // Build formatted spans
      const layerSpans = layer.spans && layer.spans.length > 0 ? layer.spans : (doc.spans || []);
      const slices = buildRenderedSlices(
        layer.text || '',
        layerSpans,
        layer.style || doc.defaultStyle || DEFAULT_TEXT_STYLE
      );

      if (slices.length > 0) {
        slices.forEach((slice) => {
          const spanEl = document.createElement('span');
          applySliceStyleToElement(spanEl, slice.style, scale);
          spanEl.textContent = slice.text;
          textInner.appendChild(spanEl);
        });
      } else {
        const spanEl = document.createElement('span');
        applySliceStyleToElement(
          spanEl,
          layer.style || doc.defaultStyle || DEFAULT_TEXT_STYLE,
          scale
        );
        spanEl.textContent = layer.text || '';
        textInner.appendChild(spanEl);
      }

      layerDiv.appendChild(textInner);
      contentLayer.appendChild(layerDiv);
    });
  } else if (hasTextInContent) {
    // Pure document text mode
    const docPad = document.createElement('div');
    docPad.dir = doc.defaultStyle?.direction || 'rtl';
    docPad.style.position = 'relative';
    docPad.style.width = '100%';
    docPad.style.height = '100%';
    docPad.style.boxSizing = 'border-box';

    const marginOption = canvasConfig.margin || 'normal';
    const marginPx =
      marginOption === 'none'
        ? 0
        : marginOption === 'compact'
        ? Math.round(30 * scale)
        : marginOption === 'wide'
        ? Math.round(80 * scale)
        : Math.round(50 * scale);
    docPad.style.padding = `${marginPx}px`;

    const textContainer = document.createElement('div');
    textContainer.dir = doc.defaultStyle?.direction || 'rtl';
    textContainer.style.fontFamily = getFontFamilyCSS(doc.defaultStyle?.fontFamily || 'Noto Nastaliq Urdu');
    textContainer.style.width = '100%';
    textContainer.style.textAlign = doc.defaultStyle?.align || 'right';
    textContainer.style.lineHeight = `${doc.defaultStyle?.lineHeight || 2.4}`;
    textContainer.style.whiteSpace = 'pre-wrap';
    textContainer.style.wordBreak = 'break-word';
    textContainer.style.opacity = `${doc.defaultStyle?.opacity ?? 1}`;
    textContainer.style.fontFeatureSettings = '"kern" 1, "liga" 1, "calt" 1';
    textContainer.style.textRendering = 'optimizeLegibility';
    (textContainer.style as any).webkitFontSmoothing = 'antialiased';
    textContainer.style.unicodeBidi = 'isolate';

    const slices = buildRenderedSlices(
      doc.content,
      doc.spans || [],
      doc.defaultStyle || DEFAULT_TEXT_STYLE
    );

    if (slices.length > 0) {
      slices.forEach((slice) => {
        const spanEl = document.createElement('span');
        applySliceStyleToElement(spanEl, slice.style, scale);
        spanEl.textContent = slice.text;
        textContainer.appendChild(spanEl);
      });
    } else {
      const spanEl = document.createElement('span');
      applySliceStyleToElement(spanEl, doc.defaultStyle || DEFAULT_TEXT_STYLE, scale);
      spanEl.textContent = doc.content;
      textContainer.appendChild(spanEl);
    }

    docPad.appendChild(textContainer);
    contentLayer.appendChild(docPad);
  } else {
    // Empty document watermark notice
    hasRenderableContent = false;
  }

  container.appendChild(contentLayer);

  // 4. Fixed Automatic Subtle Watermark (Export-only, hidden in app)
  const isDark = isDarkBackground(
    canvasConfig.color,
    canvasConfig.gradient,
    canvasConfig.image,
    canvasConfig.overlayOpacity
  );
  const watermarkEl = createExportWatermarkElement(scale, isDark);
  container.appendChild(watermarkEl);

  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  const cleanup = () => {
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  };

  return { wrapper, container, cleanup, width, height, hasRenderableContent };
}

/**
 * Validates that an exported image data URL contains actual drawn visual content
 * and is not a blank, single-color empty image.
 */
export function verifyNonBlankImage(dataUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.length < 500) {
      resolve(false);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 100;
        testCanvas.height = 100;
        const ctx = testCanvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(true);
          return;
        }
        ctx.drawImage(img, 0, 0, 100, 100);
        const imgData = ctx.getImageData(0, 0, 100, 100).data;

        const firstR = imgData[0];
        const firstG = imgData[1];
        const firstB = imgData[2];
        const firstA = imgData[3];
        let hasVariation = false;

        for (let i = 4; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (
            Math.abs(r - firstR) > 4 ||
            Math.abs(g - firstG) > 4 ||
            Math.abs(b - firstB) > 4 ||
            Math.abs(a - firstA) > 4
          ) {
            hasVariation = true;
            break;
          }
        }
        resolve(hasVariation);
      } catch {
        resolve(true);
      }
    };
    img.onerror = () => resolve(false);
    img.src = dataUrl;
  });
}

/**
 * Dedicated, pristine export runner that operates on KashurDocument data
 * without capturing the active editor UI, selection handles, keyboards, or viewport bounds.
 */
export async function exportDocumentClean(
  doc: KashurDocument,
  options: ExportOptions
): Promise<string> {
  const fileName = options.fileName || 'kashur-document';

  // 1. Ensure fonts are fully settled
  await ensureFontsReady(doc);

  // 2. Pre-load canvas background image if present
  if (doc.canvasConfig?.image) {
    await preloadImages([doc.canvasConfig.image]);
  }

  // 3. Retrieve base64-embedded font CSS
  const fontEmbedCSS = await getBase64FontEmbedCSS();

  // 4. Build clean off-screen DOM
  const { container, cleanup, width, height, hasRenderableContent } = createCleanOffscreenDom(
    doc,
    options
  );

  try {
    const commonOptions = {
      cacheBust: true,
      fontEmbedCSS: fontEmbedCSS || undefined,
      width,
      height,
      pixelRatio: 1.0, // Pre-calculated high DPI dimensions (1080p / 4K / 300 DPI)
    };

    let dataUrl = '';

    if (options.format === 'png') {
      dataUrl = await htmlToImage.toPng(container, {
        ...commonOptions,
        quality: 1,
      });

      // Blank export protection
      if (hasRenderableContent) {
        const isValid = await verifyNonBlankImage(dataUrl);
        if (!isValid) {
          throw new Error('Render validation detected an empty white document output.');
        }
      }

      const res = await saveExportToPublicStorage(dataUrl, `${fileName}.png`, 'image/png');
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to save PNG image');
      }
      return dataUrl;
    }

    if (options.format === 'transparent_png') {
      dataUrl = await htmlToImage.toPng(container, {
        ...commonOptions,
        backgroundColor: 'transparent',
        quality: 1,
      });

      if (hasRenderableContent) {
        const isValid = await verifyNonBlankImage(dataUrl);
        if (!isValid) {
          throw new Error('Render validation detected an empty transparent document output.');
        }
      }

      const res = await saveExportToPublicStorage(dataUrl, `${fileName}-transparent.png`, 'image/png');
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to save transparent PNG image');
      }
      return dataUrl;
    }

    if (options.format === 'jpeg') {
      dataUrl = await htmlToImage.toJpeg(container, {
        ...commonOptions,
        quality: options.quality || 0.96,
        backgroundColor: doc.canvasConfig?.color || '#ffffff',
      });

      if (hasRenderableContent) {
        const isValid = await verifyNonBlankImage(dataUrl);
        if (!isValid) {
          throw new Error('Render validation detected an empty JPEG document output.');
        }
      }

      const res = await saveExportToPublicStorage(dataUrl, `${fileName}.jpg`, 'image/jpeg');
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to save JPEG image');
      }
      return dataUrl;
    }

    if (options.format === 'svg') {
      dataUrl = await htmlToImage.toSvg(container, {
        ...commonOptions,
      });

      const res = await saveExportToPublicStorage(dataUrl, `${fileName}.svg`, 'image/svg+xml');
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to save SVG file');
      }
      return dataUrl;
    }

    if (options.format === 'pdf') {
      const chosenPaperSize: DocumentPaperSize =
        options.paperSize ||
        (['a3', 'a4', 'a5', 'a6', 'letter', 'legal', 'tabloid', 'b4', 'b5', 'b6'].includes(
          options.aspectRatio || ''
        )
          ? (options.aspectRatio as DocumentPaperSize)
          : 'a4');
      const orientation = options.orientation || 'portrait';
      const [pageWidthPt, pageHeightPt] = getPaperDimensionsInPt(chosenPaperSize, orientation);

      dataUrl = await htmlToImage.toPng(container, {
        ...commonOptions,
        quality: 1,
      });

      if (hasRenderableContent) {
        const isValid = await verifyNonBlankImage(dataUrl);
        if (!isValid) {
          throw new Error('Render validation detected an empty PDF page render.');
        }
      }

      const pdf = new jsPDF({
        orientation,
        unit: 'pt',
        format: [pageWidthPt, pageHeightPt],
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidthPt, pageHeightPt);
      const pdfDataUri = pdf.output('datauristring');
      const res = await saveExportToPublicStorage(pdfDataUri, `${fileName}.pdf`, 'application/pdf');
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to save PDF document');
      }
      return pdfDataUri;
    }

    return '';
  } finally {
    cleanup();
  }
}

/**
 * Share document image directly via native sharing / Web Share API using clean offscreen renderer
 */
export async function shareCanvasDocument(
  doc: KashurDocument,
  title: string,
  options: Partial<ExportOptions> = {}
): Promise<boolean> {
  await ensureFontsReady();
  const fontEmbedCSS = await getBase64FontEmbedCSS();
  const { container, cleanup, width, height } = createCleanOffscreenDom(doc, {
    fileName: title,
    format: 'png',
    ...options,
  });

  try {
    const dataUrl = await htmlToImage.toPng(container, {
      cacheBust: true,
      fontEmbedCSS: fontEmbedCSS || undefined,
      width,
      height,
      pixelRatio: 1.0,
      quality: 1,
    });

    return await shareFileNative(
      dataUrl,
      `${title || 'kashur-design'}.png`,
      title || 'کٲشُر لیٚکھُن سٹوڈیو',
      'Created with Kashur Kanvas'
    );
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.warn('Share error:', err);
    }
  } finally {
    cleanup();
  }
  return false;
}

export async function exportElement(
  element: HTMLElement,
  options: ExportOptions
): Promise<string> {
  const pixelRatio = options.pixelRatio || 2.5;
  const fileName = options.fileName || 'kashur-lekhun-export';

  await ensureFontsReady();
  const fontEmbedCSS = await getBase64FontEmbedCSS();

  const targetRatio: CanvasAspectRatio =
    options.aspectRatio ||
    (element.getAttribute('data-aspect-ratio') as CanvasAspectRatio) ||
    'auto';

  const rect = element.getBoundingClientRect();
  const currentWidth = Math.round(rect.width) || 800;

  let targetWidth: number | undefined;
  let targetHeight: number | undefined;

  if (targetRatio && targetRatio !== 'auto') {
    const effectiveRatio = getAspectRatioNumeric(targetRatio, options.orientation);
    targetWidth = currentWidth;
    targetHeight = Math.round(currentWidth / effectiveRatio);
  }

  const commonHtmlToImageOptions = {
    pixelRatio,
    cacheBust: true,
    fontEmbedCSS: fontEmbedCSS || undefined,
    width: targetWidth,
    height: targetHeight,
    style:
      targetWidth && targetHeight
        ? {
            width: `${targetWidth}px`,
            height: `${targetHeight}px`,
            maxWidth: 'none',
            maxHeight: 'none',
            minHeight: '0',
            minWidth: '0',
            transform: 'none',
          }
        : undefined,
    filter: (node: HTMLElement) => {
      if (
        node.classList &&
        (node.classList.contains('export-exclude') ||
          node.getAttribute?.('data-export-exclude') === 'true')
      ) {
        return false;
      }
      if (node.tagName === 'TEXTAREA') {
        return false;
      }
      return true;
    },
  };

  let dataUrl = '';

  if (options.format === 'png') {
    dataUrl = await htmlToImage.toPng(element, {
      ...commonHtmlToImageOptions,
      quality: 1,
    });
    const res = await saveExportToPublicStorage(dataUrl, `${fileName}.png`, 'image/png');
    if (res && res.success === false) {
      throw new Error(res.message || 'Failed to save PNG image');
    }
    return dataUrl;
  }

  if (options.format === 'transparent_png') {
    dataUrl = await htmlToImage.toPng(element, {
      ...commonHtmlToImageOptions,
      backgroundColor: 'transparent',
      quality: 1,
    });
    const res = await saveExportToPublicStorage(dataUrl, `${fileName}-transparent.png`, 'image/png');
    if (res && res.success === false) {
      throw new Error(res.message || 'Failed to save transparent PNG');
    }
    return dataUrl;
  }

  if (options.format === 'jpeg') {
    dataUrl = await htmlToImage.toJpeg(element, {
      ...commonHtmlToImageOptions,
      quality: options.quality || 0.96,
      backgroundColor: '#ffffff',
    });
    const res = await saveExportToPublicStorage(dataUrl, `${fileName}.jpg`, 'image/jpeg');
    if (res && res.success === false) {
      throw new Error(res.message || 'Failed to save JPEG image');
    }
    return dataUrl;
  }

  if (options.format === 'svg') {
    dataUrl = await htmlToImage.toSvg(element, {
      ...commonHtmlToImageOptions,
    });
    const res = await saveExportToPublicStorage(dataUrl, `${fileName}.svg`, 'image/svg+xml');
    if (res && res.success === false) {
      throw new Error(res.message || 'Failed to save SVG file');
    }
    return dataUrl;
  }

  if (options.format === 'pdf') {
    const chosenPaperSize: DocumentPaperSize =
      options.paperSize ||
      (['a3', 'a4', 'a5', 'a6', 'letter', 'legal', 'tabloid', 'b4', 'b5', 'b6'].includes(
        targetRatio
      )
        ? (targetRatio as DocumentPaperSize)
        : 'a4');
    const orientation = options.orientation || 'portrait';
    const [pageWidthPt, pageHeightPt] = getPaperDimensionsInPt(chosenPaperSize, orientation);

    dataUrl = await htmlToImage.toPng(element, {
      ...commonHtmlToImageOptions,
      pixelRatio: 3.0,
      quality: 1,
    });

    const pdf = new jsPDF({
      orientation,
      unit: 'pt',
      format: [pageWidthPt, pageHeightPt],
    });

    pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidthPt, pageHeightPt);
    const pdfDataUri = pdf.output('datauristring');
    const res = await saveExportToPublicStorage(pdfDataUri, `${fileName}.pdf`, 'application/pdf');
    if (res && res.success === false) {
      throw new Error(res.message || 'Failed to save PDF document');
    }
    return pdfDataUri;
  }

  return '';
}

export async function shareCanvasImage(
  element: HTMLElement,
  title: string,
  aspectRatio?: CanvasAspectRatio
): Promise<boolean> {
  try {
    await ensureFontsReady();
    const fontEmbedCSS = await getBase64FontEmbedCSS();

    const targetRatio: CanvasAspectRatio =
      aspectRatio ||
      (element.getAttribute('data-aspect-ratio') as CanvasAspectRatio) ||
      'auto';

    const rect = element.getBoundingClientRect();
    const currentWidth = Math.round(rect.width) || 800;

    let targetWidth: number | undefined;
    let targetHeight: number | undefined;

    if (targetRatio && targetRatio !== 'auto') {
      const ratioNum = getAspectRatioNumeric(targetRatio);
      targetWidth = currentWidth;
      targetHeight = Math.round(currentWidth / ratioNum);
    }

    const dataUrl = await htmlToImage.toPng(element, {
      pixelRatio: 2.5,
      cacheBust: true,
      fontEmbedCSS: fontEmbedCSS || undefined,
      width: targetWidth,
      height: targetHeight,
      filter: (node: HTMLElement) => {
        if (
          node.classList &&
          (node.classList.contains('export-exclude') ||
            node.getAttribute?.('data-export-exclude') === 'true')
        )
          return false;
        if (node.tagName === 'TEXTAREA') return false;
        return true;
      },
    });

    return await shareFileNative(
      dataUrl,
      'kashur-design.png',
      title || 'کٲشُر لیٚکھُن سٹوڈیو',
      'Created with Kashur Kanvas'
    );
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.warn('Share error:', err);
    }
  }
  return false;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      textArea.remove();
      return success;
    }
  } catch {
    return false;
  }
}

export async function downloadTextFile(
  content: string,
  filename: string
): Promise<{ success: boolean; path?: string; uri?: string; message?: string }> {
  const fullFileName = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed reading text file blob'));
    reader.readAsDataURL(blob);
  });
  return await saveExportToPublicStorage(dataUrl, fullFileName, 'text/plain;charset=utf-8');
}

export async function downloadDocFile(
  title: string,
  content: string,
  filename: string,
  paperSize: DocumentPaperSize = 'a4',
  orientation: 'portrait' | 'landscape' = 'portrait',
  opacity: number = 1,
  doc?: KashurDocument
): Promise<{ success: boolean; path?: string; uri?: string; message?: string }> {
  const sizeMap: Record<DocumentPaperSize, string> = {
    a3: '297mm 420mm',
    a4: '210mm 297mm',
    a5: '148mm 210mm',
    a6: '105mm 148mm',
    letter: '8.5in 11.0in',
    legal: '8.5in 14.0in',
    tabloid: '11.0in 17.0in',
    b4: '250mm 353mm',
    b5: '176mm 250mm',
    b6: '125mm 176mm',
  };

  const pageSizeStr = sizeMap[paperSize] || '210mm 297mm';

  let bodyHtml = '';
  if (doc && doc.textLayers && doc.textLayers.length > 0) {
    const visibleLayers = doc.textLayers.filter((l) => !l.isHidden && l.text?.trim());
    if (visibleLayers.length > 0) {
      bodyHtml = visibleLayers
        .map((l) => {
          const slices = buildRenderedSlices(
            l.text || '',
            l.spans || [],
            l.style || doc.defaultStyle || DEFAULT_TEXT_STYLE
          );
          const inner = slices
            .map((s) => {
              const font = getFontFamilyCSS(s.style.fontFamily || 'Noto Nastaliq Urdu');
              const color = s.style.color || '#1c1917';
              const weight = s.style.bold ? 'bold' : 'normal';
              const style = s.style.italic ? 'italic' : 'normal';
              const decor = s.style.underline ? 'underline' : 'none';
              const bg =
                s.style.highlightColor && s.style.highlightColor !== 'transparent'
                  ? `background-color: ${s.style.highlightColor};`
                  : '';
              return `<span style="font-family: ${font}; color: ${color}; font-weight: ${weight}; font-style: ${style}; text-decoration: ${decor}; ${bg}">${s.text.replace(
                /\n/g,
                '<br/>'
              )}</span>`;
            })
            .join('');
          return `<p style="text-align: ${l.style?.align || 'center'}; line-height: ${
            l.style?.lineHeight || 2.2
          }; margin: 12px 0;">${inner}</p>`;
        })
        .join('\n');
    }
  }

  if (!bodyHtml) {
    if (doc && doc.content) {
      const slices = buildRenderedSlices(
        doc.content,
        doc.spans || [],
        doc.defaultStyle || DEFAULT_TEXT_STYLE
      );
      bodyHtml = slices
        .map((s) => {
          const font = getFontFamilyCSS(s.style.fontFamily || 'Noto Nastaliq Urdu');
          const color = s.style.color || '#1c1917';
          const weight = s.style.bold ? 'bold' : 'normal';
          const style = s.style.italic ? 'italic' : 'normal';
          const decor = s.style.underline ? 'underline' : 'none';
          const bg =
            s.style.highlightColor && s.style.highlightColor !== 'transparent'
              ? `background-color: ${s.style.highlightColor};`
              : '';
          return `<span style="font-family: ${font}; color: ${color}; font-weight: ${weight}; font-style: ${style}; text-decoration: ${decor}; ${bg}">${s.text.replace(
            /\n/g,
            '<br/>'
          )}</span>`;
        })
        .join('');
    } else {
      bodyHtml = content.replace(/\n/g, '<br/>');
    }
  }

  const customFontsCss = getCustomFontsCSS();

  const htmlContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' lang="ks" dir="rtl">
<head>
<meta charset="utf-8">
<title>${title || 'کٲشُر مسودہ'}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@import url('https://fonts.googleapis.com/css2?family=Gulzar&family=Noto+Nastaliq+Urdu:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Amiri:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
${customFontsCss}
@page Section1 {
  size: ${pageSizeStr} ${orientation};
  margin: 1.0in 1.0in 1.0in 1.0in;
  mso-header-margin: 0.5in;
  mso-footer-margin: 0.5in;
  mso-paper-source: 0;
}
div.Section1 {
  page: Section1;
}
body { 
  font-family: 'Noto Nastaliq Urdu', 'Urdu Typesetting', 'Jameel Noori Nastaleeq', 'Gulzar', 'Amiri', 'Noto Sans Arabic', serif; 
  direction: rtl; 
  text-align: right; 
  line-height: 2.3; 
  font-size: 16pt; 
  color: #1c1917;
  background-color: #ffffff;
  margin: 0;
  padding: 0;
  mso-bidi-font-family: 'Noto Nastaliq Urdu';
  mso-ascii-font-family: 'Noto Nastaliq Urdu';
  mso-hansi-font-family: 'Noto Nastaliq Urdu';
}
h1.doc-title { 
  font-size: 24pt; 
  color: #065f46; 
  border-bottom: 2px solid #059669; 
  padding-bottom: 12px; 
  margin-bottom: 24px; 
  font-weight: bold;
  text-align: right;
  font-family: 'Noto Nastaliq Urdu', 'Gulzar', serif;
}
.content-body {
  white-space: pre-wrap;
  word-wrap: break-word;
  opacity: ${opacity};
}
.watermark {
  margin-top: 40px;
  padding-top: 15px;
  border-top: 1px solid #e7e5e4;
  font-size: 11pt;
  color: #a8a29e;
  text-align: center;
  font-family: 'Noto Nastaliq Urdu', 'Gulzar', serif;
  direction: rtl;
}
</style>
</head>
<body>
<div class="Section1">
<h1 class="doc-title">${title || 'کٲشُر مسودہ'}</h1>
<div class="content-body">${bodyHtml}</div>
<div class="watermark">کٲشُرکنْواس</div>
</div>
</body>
</html>`;

  const fullFileName = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed reading doc file blob'));
    reader.readAsDataURL(blob);
  });
  return await saveExportToPublicStorage(dataUrl, fullFileName, 'application/msword');
}

function triggerDownload(dataUrl: string, filename: string) {
  saveExportToPublicStorage(dataUrl, filename).catch(() => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}


