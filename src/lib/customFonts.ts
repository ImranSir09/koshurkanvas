export interface CustomFontItem {
  id: string;
  name: string;
  dataUrl: string;
  format: string; // 'truetype' | 'opentype' | 'woff' | 'woff2'
  createdAt: number;
}

const STORAGE_KEY = 'kashur_custom_fonts_v1';

let loadedCustomFonts: CustomFontItem[] = [];

/**
 * Loads all saved custom fonts from localStorage into document.fonts
 */
export async function loadSavedCustomFonts(): Promise<CustomFontItem[]> {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: CustomFontItem[] = JSON.parse(raw);
    loadedCustomFonts = parsed;

    // Load each font into document.fonts using FontFace API
    for (const item of parsed) {
      try {
        const font = new FontFace(item.name, `url(${item.dataUrl})`);
        await font.load();
        document.fonts.add(font);
      } catch (err) {
        console.warn(`Failed to load custom font ${item.name}:`, err);
      }
    }
    return parsed;
  } catch (err) {
    console.error('Error loading saved custom fonts:', err);
    return [];
  }
}

/**
 * Gets currently loaded custom fonts
 */
export function getCustomFonts(): CustomFontItem[] {
  return loadedCustomFonts;
}

/**
 * Reads a font file (.ttf, .otf, .woff, .woff2), registers it with document.fonts, and saves to storage
 */
export async function addCustomFont(file: File): Promise<CustomFontItem> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  let format = 'truetype';
  if (ext === 'otf') format = 'opentype';
  else if (ext === 'woff') format = 'woff';
  else if (ext === 'woff2') format = 'woff2';

  // Format clean font name
  const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_ -]/g, '');
  const fontName = rawName.trim() || `CustomFont_${Date.now()}`;

  // Read file as base64 Data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Load into browser document.fonts
  const fontFace = new FontFace(fontName, `url(${dataUrl})`);
  await fontFace.load();
  document.fonts.add(fontFace);

  const item: CustomFontItem = {
    id: `font-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: fontName,
    dataUrl,
    format,
    createdAt: Date.now(),
  };

  loadedCustomFonts = [item, ...loadedCustomFonts.filter((f) => f.name !== fontName)];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedCustomFonts));
  } catch (e) {
    console.warn('Storage quota exceeded saving font locally:', e);
  }

  return item;
}

/**
 * Removes a custom font from memory and storage
 */
export function deleteCustomFont(id: string): void {
  loadedCustomFonts = loadedCustomFonts.filter((f) => f.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedCustomFonts));
  } catch (e) {
    console.warn('Error saving custom fonts after deletion:', e);
  }
}

/**
 * Generates @font-face CSS definitions for all registered custom fonts
 */
export function getCustomFontsCSS(): string {
  if (loadedCustomFonts.length === 0) return '';
  return loadedCustomFonts
    .map(
      (f) => `
@font-face {
  font-family: '${f.name}';
  src: url('${f.dataUrl}') format('${f.format}');
  font-weight: normal;
  font-style: normal;
}
`
    )
    .join('\n');
}
