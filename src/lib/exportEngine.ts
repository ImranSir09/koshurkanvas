import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { CanvasAspectRatio, DocumentPaperSize, KashurDocument, TextStyleProperties, TextStyleSpan } from '../types';
import { getFontFamilyCSS } from './fontUtils';
import { buildRenderedSlices } from './textEngine';
import { DEFAULT_TEXT_STYLE } from './kashmiriData';
import { getCustomFontsCSS } from './customFonts';
import { saveExportToPublicStorage, shareFileNative, isNativeAndroid } from './nativeStorage';

export interface ExportOptions {
  fileName: string;
  format: 'png' | 'jpeg' | 'pdf' | 'transparent_png' | 'svg';
  pixelRatio?: number;
  quality?: number;
  aspectRatio?: CanvasAspectRatio;
  paperSize?: DocumentPaperSize;
  orientation?: 'portrait' | 'landscape';
  includeBorder?: boolean;
}

let cachedFontEmbedCSS: string | null = null;
let fontLoadingPromise: Promise<string> | null = null;

/**
 * Extracts and prepares embedded CSS for Noto Nastaliq Urdu, Gulzar, Amiri,
 * Noto Sans Arabic, and Plus Jakarta Sans from local document stylesheets and Google Fonts.
 */
export async function getBase64FontEmbedCSS(): Promise<string> {
  if (cachedFontEmbedCSS) return cachedFontEmbedCSS;
  if (fontLoadingPromise) return fontLoadingPromise;

  fontLoadingPromise = (async () => {
    let combinedCSS = '';

    // 1. Extract existing @font-face rules from loaded document stylesheets
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

    // 2. Fetch Google Fonts CSS with base64 embedded binary files if not already cached
    try {
      const fontCssUrl =
        'https://fonts.googleapis.com/css2?family=Gulzar&family=Noto+Nastaliq+Urdu:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Amiri:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';

      const res = await fetch(fontCssUrl);
      if (res.ok) {
        let cssText = await res.text();
        const matches = Array.from(cssText.matchAll(/url\((https:\/\/[^)]+)\)/g));
        const urlToDataMap = new Map<string, string>();

        await Promise.allSettled(
          matches.map(async (m) => {
            const rawUrl = m[1].replace(/['"]/g, '');
            if (urlToDataMap.has(rawUrl)) return;
            try {
              const fontRes = await fetch(rawUrl);
              const blob = await fontRes.blob();
              const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
              urlToDataMap.set(rawUrl, base64);
            } catch {
              // Ignore single font binary fetch failure
            }
          })
        );

        for (const [url, dataUri] of urlToDataMap.entries()) {
          cssText = cssText.split(url).join(dataUri);
        }
        combinedCSS += '\n' + cssText;
      }
    } catch {
      // Fallback gracefully to stylesheet rules
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
export async function ensureFontsReady(): Promise<boolean> {
  if (typeof document === 'undefined' || !document.fonts) return true;
  try {
    await document.fonts.ready;
    const fontsToCheck = [
      '24px "Noto Nastaliq Urdu"',
      'bold 24px "Noto Nastaliq Urdu"',
      '24px "Gulzar"',
      '24px "Amiri"',
      '24px "Noto Sans Arabic"',
      '24px "Plus Jakarta Sans"',
    ];
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
      return isLand ? 16 / 9 : 16 / 9;
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
      return isLandscape ? { refWidth: 720, refHeight: 405 } : { refWidth: 405, refHeight: 720 };
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
      return { width: isLand ? 1920 : 1080, height: isLand ? 1080 : 1920, refWidth, refHeight };
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
  el.style.fontWeight = style.bold ? 'bold' : 'normal';
  el.style.fontStyle = style.italic ? 'italic' : 'normal';
  el.style.textDecoration = style.underline ? 'underline' : 'none';
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
      textInner.style.textAlign = layer.style?.align || 'center';
      textInner.style.lineHeight = `${layer.style?.lineHeight || 2.2}`;
      textInner.style.letterSpacing = `${Math.round((layer.style?.letterSpacing || 0) * scale)}px`;
      textInner.style.whiteSpace = 'pre-wrap';
      textInner.style.wordBreak = 'break-word';
      textInner.style.overflow = 'visible';
      textInner.style.width = '100%';
      textInner.style.boxSizing = 'border-box';
      textInner.style.fontFeatureSettings = '"kern" 1, "liga" 1, "calt" 1';

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
    textContainer.style.width = '100%';
    textContainer.style.textAlign = doc.defaultStyle?.align || 'right';
    textContainer.style.lineHeight = `${doc.defaultStyle?.lineHeight || 2.4}`;
    textContainer.style.whiteSpace = 'pre-wrap';
    textContainer.style.wordBreak = 'break-word';
    textContainer.style.fontFeatureSettings = '"kern" 1, "liga" 1, "calt" 1';

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
  await ensureFontsReady();

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

      await saveExportToPublicStorage(dataUrl, `${fileName}.png`, 'image/png');
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

      await saveExportToPublicStorage(dataUrl, `${fileName}-transparent.png`, 'image/png');
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

      await saveExportToPublicStorage(dataUrl, `${fileName}.jpg`, 'image/jpeg');
      return dataUrl;
    }

    if (options.format === 'svg') {
      dataUrl = await htmlToImage.toSvg(container, {
        ...commonOptions,
      });

      await saveExportToPublicStorage(dataUrl, `${fileName}.svg`, 'image/svg+xml');
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
      await saveExportToPublicStorage(pdfDataUri, `${fileName}.pdf`, 'application/pdf');
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
    await saveExportToPublicStorage(dataUrl, `${fileName}.png`, 'image/png');
    return dataUrl;
  }

  if (options.format === 'transparent_png') {
    dataUrl = await htmlToImage.toPng(element, {
      ...commonHtmlToImageOptions,
      backgroundColor: 'transparent',
      quality: 1,
    });
    await saveExportToPublicStorage(dataUrl, `${fileName}-transparent.png`, 'image/png');
    return dataUrl;
  }

  if (options.format === 'jpeg') {
    dataUrl = await htmlToImage.toJpeg(element, {
      ...commonHtmlToImageOptions,
      quality: options.quality || 0.96,
      backgroundColor: '#ffffff',
    });
    await saveExportToPublicStorage(dataUrl, `${fileName}.jpg`, 'image/jpeg');
    return dataUrl;
  }

  if (options.format === 'svg') {
    dataUrl = await htmlToImage.toSvg(element, {
      ...commonHtmlToImageOptions,
    });
    await saveExportToPublicStorage(dataUrl, `${fileName}.svg`, 'image/svg+xml');
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
    await saveExportToPublicStorage(pdfDataUri, `${fileName}.pdf`, 'application/pdf');
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

export function downloadTextFile(content: string, filename: string) {
  const fullFileName = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const reader = new FileReader();
  reader.onloadend = () => {
    const dataUrl = reader.result as string;
    saveExportToPublicStorage(dataUrl, fullFileName, 'text/plain;charset=utf-8');
  };
  reader.readAsDataURL(blob);
}

export function downloadDocFile(
  title: string,
  content: string,
  filename: string,
  paperSize: DocumentPaperSize = 'a4',
  orientation: 'portrait' | 'landscape' = 'portrait'
) {
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
@import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap');
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
  font-family: 'Noto Nastaliq Urdu', 'Urdu Typesetting', 'Jameel Noori Nastaleeq', 'Gulzar', 'Amiri', serif; 
  direction: rtl; 
  text-align: right; 
  line-height: 2.3; 
  font-size: 16pt; 
  color: #1c1917;
  background-color: #ffffff;
  margin: 0;
  padding: 0;
}
h1.doc-title { 
  font-size: 24pt; 
  color: #065f46; 
  border-bottom: 2px solid #059669; 
  padding-bottom: 12px; 
  margin-bottom: 24px; 
  font-weight: bold;
  text-align: right;
}
.content-body {
  white-space: pre-wrap;
  word-wrap: break-word;
}
.watermark {
  margin-top: 40px;
  padding-top: 15px;
  border-top: 1px solid #e7e5e4;
  font-size: 11pt;
  color: #a8a29e;
  text-align: center;
}
</style>
</head>
<body>
<div class="Section1">
<h1 class="doc-title">${title || 'کٲشُر مسودہ'}</h1>
<div class="content-body">${content.replace(/\n/g, '<br/>')}</div>
<div class="watermark">کٲشُر لیٚکھُن سٹوڈیو — Noto Nastaliq Urdu</div>
</div>
</body>
</html>`;

  const fullFileName = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
  const reader = new FileReader();
  reader.onloadend = () => {
    const dataUrl = reader.result as string;
    saveExportToPublicStorage(dataUrl, fullFileName, 'application/msword');
  };
  reader.readAsDataURL(blob);
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


