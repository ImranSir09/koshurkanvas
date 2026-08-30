import { DesignProject, KashurDocument } from '../types';
import { DEFAULT_TEXT_STYLE } from './kashmiriData';
import { db, handleFirestoreError, OperationType } from './firebase';
import { doc as firestoreDoc, setDoc, deleteDoc } from 'firebase/firestore';

const DB_NAME = 'KashurLekhunStudioDB';
const DB_VERSION = 1;
const STORE_DOCS = 'documents';
const STORE_DESIGNS = 'designs';
const STORE_SETTINGS = 'settings';
const STORE_RECENT_CHARS = 'recent_chars';

// Open / initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_DOCS)) {
        db.createObjectStore(STORE_DOCS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_DESIGNS)) {
        db.createObjectStore(STORE_DESIGNS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_RECENT_CHARS)) {
        db.createObjectStore(STORE_RECENT_CHARS, { keyPath: 'char' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Initial sample document
export const INITIAL_DOCUMENT: KashurDocument = {
  id: 'doc-welcome-kashmiri',
  title: 'Welcome Draft',
  content: `آمِ پَنہٕ سوَدَرَس ناڤ چَھم لَگان
کاتیہ رازی دَے مےٚ تی تاری ہا

کٲشُر لیٚکھُن سٹوڈیو چُھ کٲشِرِ زَبانہِ ہٕنٛدِ خٲطرٕ اَکھ مۄکَمَل تہٕ جَدِید یُونیکوڈ سِسٹم۔
تُہؠ ہؠکِو اَتھ مَنٛز کٲشِرؠ واول (ٲ، ۄ، ؠ، ۆ، ےٚ)، اِعراب (ـَ ـِ ـُ ـْ ـّ ـٚ ـ٘ ـٕ ـٔ) لؠکھِتھ، شٲعِری تہٕ پوسٹَر تَیار کٔرِتھ۔`,
  spans: [
    {
      id: 'span-1',
      start: 0,
      end: 63,
      style: {
        fontSize: 32,
        bold: true,
        color: '#b45309', // amber-700
      },
    },
  ],
  defaultStyle: DEFAULT_TEXT_STYLE,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// Initial sample design project
export const INITIAL_DESIGN: DesignProject = {
  id: 'design-sample-1',
  title: 'لال دؠد واکھ پوسٹَر',
  preset: '1:1',
  width: 1080,
  height: 1080,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  layers: [
    {
      id: 'bg-1',
      name: 'Background',
      type: 'background',
      bgType: 'gradient',
      color: '#1c1917',
      gradient: {
        from: '#78350f',
        to: '#0c0a09',
        angle: 135,
      },
      pattern: 'kashmir-pattern',
      x: 0,
      y: 0,
      width: 1080,
      height: 1080,
      rotation: 0,
      opacity: 1,
      zIndex: 0,
      isLocked: true,
      isHidden: false,
    },
    {
      id: 'shape-frame-1',
      name: 'Border Frame',
      type: 'shape',
      shapeType: 'frame',
      fillColor: 'transparent',
      strokeColor: '#f59e0b',
      strokeWidth: 4,
      borderRadius: 16,
      x: 40,
      y: 40,
      width: 1000,
      height: 1000,
      rotation: 0,
      opacity: 0.6,
      zIndex: 1,
      isLocked: false,
      isHidden: false,
    },
    {
      id: 'sticker-chinar-1',
      name: 'Chinar Leaf Top',
      type: 'sticker',
      stickerId: 'chinar-leaf',
      svgContent: '🍁',
      color: '#f59e0b',
      x: 500,
      y: 120,
      width: 80,
      height: 80,
      rotation: 0,
      opacity: 0.9,
      zIndex: 2,
      isLocked: false,
      isHidden: false,
    },
    {
      id: 'text-heading-1',
      name: 'Kashmiri Poetry Text',
      type: 'text',
      text: `آمِ پَنہٕ سوَدَرَس ناڤ چَھم لَگان
کاتیہ رازی دَے مےٚ تی تاری ہا`,
      style: {
        fontFamily: 'Noto Nastaliq Urdu',
        fontSize: 54,
        bold: true,
        italic: false,
        underline: false,
        color: '#fef3c7', // amber-100
        align: 'center',
        lineHeight: 2.3,
        letterSpacing: 0,
        direction: 'rtl',
        shadowColor: 'rgba(0,0,0,0.7)',
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        opacity: 1,
      },
      x: 90,
      y: 320,
      width: 900,
      height: 380,
      rotation: 0,
      opacity: 1,
      zIndex: 3,
      isLocked: false,
      isHidden: false,
    },
    {
      id: 'text-author-1',
      name: 'Poet Attribution',
      type: 'text',
      text: '— لال دؠد (Lal Ded)',
      style: {
        fontFamily: 'Noto Nastaliq Urdu',
        fontSize: 34,
        bold: false,
        italic: false,
        underline: false,
        color: '#fbbf24', // amber-400
        align: 'center',
        lineHeight: 2.0,
        letterSpacing: 0,
        direction: 'rtl',
        opacity: 0.95,
      },
      x: 290,
      y: 780,
      width: 500,
      height: 120,
      rotation: 0,
      opacity: 1,
      zIndex: 4,
      isLocked: false,
      isHidden: false,
    },
  ],
};

// Document Storage API
export async function getAllDocuments(): Promise<KashurDocument[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_DOCS, 'readonly');
      const store = transaction.objectStore(STORE_DOCS);
      const request = store.getAll();
      request.onsuccess = () => {
        const docs = request.result as KashurDocument[];
        if (!docs || docs.length === 0) {
          // Initialize with default
          saveDocument(INITIAL_DOCUMENT);
          resolve([INITIAL_DOCUMENT]);
        } else {
          // Sort newest updated first
          docs.sort((a, b) => b.updatedAt - a.updatedAt);
          resolve(docs);
        }
      };
      request.onerror = () => {
        resolve(getFallbackDocs());
      };
    });
  } catch {
    return getFallbackDocs();
  }
}

export async function saveDocument(docItem: KashurDocument): Promise<void> {
  docItem.updatedAt = Date.now();
  try {
    const dbInstance = await openDB();
    const transaction = dbInstance.transaction(STORE_DOCS, 'readwrite');
    transaction.objectStore(STORE_DOCS).put(docItem);
  } catch {
    // fallback
    const docs = getFallbackDocs();
    const idx = docs.findIndex((d) => d.id === docItem.id);
    if (idx >= 0) docs[idx] = docItem;
    else docs.unshift(docItem);
    localStorage.setItem('kashur_docs_fallback', JSON.stringify(docs));
  }

  // Asynchronous cloud sync to Firestore
  try {
    if (db) {
      const docRef = firestoreDoc(db, 'documents', docItem.id);
      setDoc(docRef, JSON.parse(JSON.stringify(docItem)), { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `documents/${docItem.id}`);
      });
    }
  } catch {}
}

export async function deleteDocument(id: string): Promise<void> {
  try {
    const dbInstance = await openDB();
    const transaction = dbInstance.transaction(STORE_DOCS, 'readwrite');
    transaction.objectStore(STORE_DOCS).delete(id);
  } catch {
    const docs = getFallbackDocs().filter((d) => d.id !== id);
    localStorage.setItem('kashur_docs_fallback', JSON.stringify(docs));
  }

  try {
    if (db) {
      deleteDoc(firestoreDoc(db, 'documents', id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `documents/${id}`);
      });
    }
  } catch {}
}

function getFallbackDocs(): KashurDocument[] {
  try {
    const stored = localStorage.getItem('kashur_docs_fallback');
    if (stored) return JSON.parse(stored);
  } catch {}
  return [INITIAL_DOCUMENT];
}

// Designs Storage API
export async function getAllDesigns(): Promise<DesignProject[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_DESIGNS, 'readonly');
      const store = transaction.objectStore(STORE_DESIGNS);
      const request = store.getAll();
      request.onsuccess = () => {
        const designs = request.result as DesignProject[];
        if (!designs || designs.length === 0) {
          saveDesign(INITIAL_DESIGN);
          resolve([INITIAL_DESIGN]);
        } else {
          designs.sort((a, b) => b.updatedAt - a.updatedAt);
          resolve(designs);
        }
      };
      request.onerror = () => {
        resolve(getFallbackDesigns());
      };
    });
  } catch {
    return getFallbackDesigns();
  }
}

export async function saveDesign(designItem: DesignProject): Promise<void> {
  designItem.updatedAt = Date.now();
  try {
    const dbInstance = await openDB();
    const transaction = dbInstance.transaction(STORE_DESIGNS, 'readwrite');
    transaction.objectStore(STORE_DESIGNS).put(designItem);
  } catch {
    const designs = getFallbackDesigns();
    const idx = designs.findIndex((d) => d.id === designItem.id);
    if (idx >= 0) designs[idx] = designItem;
    else designs.unshift(designItem);
    localStorage.setItem('kashur_designs_fallback', JSON.stringify(designs));
  }

  // Asynchronous cloud sync to Firestore
  try {
    if (db) {
      const docRef = firestoreDoc(db, 'designs', designItem.id);
      setDoc(docRef, JSON.parse(JSON.stringify(designItem)), { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `designs/${designItem.id}`);
      });
    }
  } catch {}
}

export async function deleteDesign(id: string): Promise<void> {
  try {
    const dbInstance = await openDB();
    const transaction = dbInstance.transaction(STORE_DESIGNS, 'readwrite');
    transaction.objectStore(STORE_DESIGNS).delete(id);
  } catch {
    const list = getFallbackDesigns().filter((d) => d.id !== id);
    localStorage.setItem('kashur_designs_fallback', JSON.stringify(list));
  }

  try {
    if (db) {
      deleteDoc(firestoreDoc(db, 'designs', id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `designs/${id}`);
      });
    }
  } catch {}
}

function getFallbackDesigns(): DesignProject[] {
  try {
    const stored = localStorage.getItem('kashur_designs_fallback');
    if (stored) return JSON.parse(stored);
  } catch {}
  return [INITIAL_DESIGN];
}

// Recent Characters API
export async function getRecentCharacters(): Promise<string[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_RECENT_CHARS, 'readonly');
      const store = transaction.objectStore(STORE_RECENT_CHARS);
      const request = store.getAll();
      request.onsuccess = () => {
        const items = (request.result || []).sort(
          (a: { time: number }, b: { time: number }) => b.time - a.time
        );
        const chars = items.map((i: { char: string }) => i.char);
        if (chars.length === 0) {
          resolve(['ٲ', 'ۄ', 'ؠ', 'ۆ', 'ےٚ', 'َ', 'ِ', 'ُ', 'ْ', 'ّ', 'ٚ', '٘']);
        } else {
          resolve(chars.slice(0, 16));
        }
      };
      request.onerror = () => {
        resolve(['ٲ', 'ۄ', 'ؠ', 'ۆ', 'ےٚ', 'َ', 'ِ', 'ُ', 'ْ', 'ّ', 'ٚ', '٘']);
      };
    });
  } catch {
    return ['ٲ', 'ۄ', 'ؠ', 'ۆ', 'ےٚ', 'َ', 'ِ', 'ُ', 'ْ', 'ّ', 'ٚ', '٘'];
  }
}

export async function trackRecentCharacter(char: string): Promise<void> {
  if (!char || char.trim() === '') return;
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_RECENT_CHARS, 'readwrite');
    transaction.objectStore(STORE_RECENT_CHARS).put({ char, time: Date.now() });
  } catch {
    // fallback
  }
}
