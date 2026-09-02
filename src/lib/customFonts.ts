export interface CustomFontItem {
  id: string;
  name: string;
  dataUrl: string;
  format: string; // 'truetype' | 'opentype' | 'woff' | 'woff2'
  createdAt: number;
}

const DB_NAME = 'KashurCustomFontsDB';
const DB_VERSION = 1;
const STORE_FONTS = 'fonts';
const LEGACY_STORAGE_KEY = 'kashur_custom_fonts_v1';

let loadedCustomFonts: CustomFontItem[] = [];

type FontChangeListener = () => void;
const fontListeners: Set<FontChangeListener> = new Set();

export function onCustomFontsChange(listener: FontChangeListener): () => void {
  fontListeners.add(listener);
  return () => fontListeners.delete(listener);
}

function notifyFontListeners() {
  fontListeners.forEach((l) => {
    try {
      l();
    } catch {}
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kashur-custom-fonts-changed'));
  }
}

/**
 * Open / initialize custom fonts IndexedDB database
 */
function openFontDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_FONTS)) {
        db.createObjectStore(STORE_FONTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open custom font database'));
  });
}

/**
 * Retrieves all stored custom fonts from IndexedDB
 */
async function getAllFontsFromDB(): Promise<CustomFontItem[]> {
  try {
    const db = await openFontDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_FONTS, 'readonly');
      const store = tx.objectStore(STORE_FONTS);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as CustomFontItem[]) || [];
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        resolve(items);
      };
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Error reading custom fonts from IndexedDB:', err);
    return [];
  }
}

/**
 * Persists a custom font record into IndexedDB
 */
async function saveFontToDB(item: CustomFontItem): Promise<void> {
  const db = await openFontDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FONTS, 'readwrite');
    const store = tx.objectStore(STORE_FONTS);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error('Failed to save custom font to persistent storage'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  });
}

/**
 * Deletes a custom font record from IndexedDB
 */
async function deleteFontFromDB(id: string): Promise<void> {
  try {
    const db = await openFontDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FONTS, 'readwrite');
      const store = tx.objectStore(STORE_FONTS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error deleting custom font from IndexedDB:', err);
  }
}

/**
 * Migrates existing legacy custom fonts from localStorage to IndexedDB on first run
 */
async function migrateLegacyLocalStorageFonts(): Promise<void> {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return;
    const parsed: CustomFontItem[] = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      for (const item of parsed) {
        if (item && item.id && item.name && item.dataUrl) {
          await saveFontToDB(item);
        }
      }
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    console.warn('Legacy custom font migration note:', err);
  }
}

/**
 * Helper to register a font face globally in document.fonts
 */
async function registerFontFace(name: string, dataUrl: string): Promise<boolean> {
  if (typeof document === 'undefined' || !document.fonts) return false;
  try {
    const isLoaded = Array.from(document.fonts).some(
      (f) => f.family === name || f.family === `"${name}"` || f.family === `'${name}'`
    );
    if (!isLoaded) {
      const font = new FontFace(name, `url(${dataUrl})`);
      await font.load();
      document.fonts.add(font);
    }
    return true;
  } catch (err) {
    console.warn(`Failed to register custom font ${name}:`, err);
    return false;
  }
}

/**
 * Loads all saved custom fonts from IndexedDB (with legacy localStorage migration) into document.fonts
 */
export async function loadSavedCustomFonts(): Promise<CustomFontItem[]> {
  if (typeof window === 'undefined') return [];
  try {
    // 1. Migrate legacy localStorage fonts if present
    await migrateLegacyLocalStorageFonts();

    // 2. Read all saved fonts from IndexedDB
    const items = await getAllFontsFromDB();
    loadedCustomFonts = items;

    // 3. Register each font with the browser's FontFace API
    for (const item of items) {
      await registerFontFace(item.name, item.dataUrl);
    }

    notifyFontListeners();
    return loadedCustomFonts;
  } catch (err) {
    console.error('Error loading saved custom fonts:', err);
    return loadedCustomFonts;
  }
}

/**
 * Gets currently loaded custom fonts
 */
export function getCustomFonts(): CustomFontItem[] {
  return loadedCustomFonts;
}

/**
 * Reads a font file (.ttf, .otf, .woff, .woff2), registers it with document.fonts, and saves to IndexedDB
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
    reader.onerror = () => reject(new Error('Failed to read font file'));
    reader.readAsDataURL(file);
  });

  // Load into browser document.fonts
  const fontFace = new FontFace(fontName, `url(${dataUrl})`);
  await fontFace.load();
  document.fonts.add(fontFace);

  const item: CustomFontItem = {
    id: `font-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: fontName,
    dataUrl,
    format,
    createdAt: Date.now(),
  };

  // Persist to IndexedDB - if storage fails, error propagates
  await saveFontToDB(item);

  loadedCustomFonts = [item, ...loadedCustomFonts.filter((f) => f.name !== fontName && f.id !== item.id)];
  notifyFontListeners();

  return item;
}

/**
 * Removes a custom font from memory and IndexedDB
 */
export function deleteCustomFont(id: string): void {
  const item = loadedCustomFonts.find((f) => f.id === id);
  loadedCustomFonts = loadedCustomFonts.filter((f) => f.id !== id);
  notifyFontListeners();

  if (item && typeof document !== 'undefined' && document.fonts) {
    try {
      const matching = Array.from(document.fonts).filter(
        (f) => f.family === item.name || f.family === `"${item.name}"` || f.family === `'${item.name}'`
      );
      matching.forEach((f) => document.fonts.delete(f));
    } catch {}
  }

  deleteFontFromDB(id).catch((e) => {
    console.warn('Error saving custom fonts after deletion:', e);
  });
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
