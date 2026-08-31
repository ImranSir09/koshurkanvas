import React, { useState, useEffect, useCallback } from 'react';
import {
  KashurDocument
} from './types';
import {
  getAllDocuments,
  saveDocument,
  deleteDocument,
  INITIAL_DOCUMENT
} from './lib/storage';
import { DEFAULT_TEXT_STYLE } from './lib/kashmiriData';
import { Header } from './components/Header';
import { KashmiriEditor } from './components/KashmiriEditor';
import { CharacterPickerModal } from './components/CharacterPickerModal';
import { ExportModal } from './components/ExportModal';
import { ProjectsDrawer } from './components/ProjectsDrawer';
import { TransliterationModal } from './components/TransliterationModal';
import { loadSavedCustomFonts } from './lib/customFonts';
import { initNotificationService } from './lib/notificationService';
import { checkForAppUpdate, AppReleaseInfo } from './lib/versionService';
import { UpdateAvailableModal } from './components/UpdateAvailableModal';

export default function App() {
  // Data State
  const [documents, setDocuments] = useState<KashurDocument[]>([INITIAL_DOCUMENT]);
  const [currentDoc, setCurrentDoc] = useState<KashurDocument>(INITIAL_DOCUMENT);

  // Modals state
  const [isCharPickerOpen, setIsCharPickerOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState<boolean>(false);
  const [isTransliterationOpen, setIsTransliterationOpen] = useState<boolean>(false);

  // App Update State
  const [updateReleaseInfo, setUpdateReleaseInfo] = useState<AppReleaseInfo | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);

  // Background Automatic Update Check on Launch
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const release = await checkForAppUpdate();
        if (release && release.hasUpdate) {
          setUpdateReleaseInfo(release);
          setIsUpdateModalOpen(true);
        }
      } catch (err) {
        console.warn('Background update check:', err);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleManualCheckUpdates = useCallback(async (): Promise<boolean> => {
    try {
      const release = await checkForAppUpdate(undefined, true);
      if (release && release.hasUpdate) {
        setUpdateReleaseInfo(release);
        setIsUpdateModalOpen(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFocusedWritingMode, setIsFocusedWritingMode] = useState<boolean>(true);

  // Undo / Redo Global State
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  const handleUndo = useCallback(() => {
    window.dispatchEvent(new CustomEvent('app-undo'));
  }, []);

  const handleRedo = useCallback(() => {
    window.dispatchEvent(new CustomEvent('app-redo'));
  }, []);

  // Enforce pure white light mode independently of device OS/phone theme
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    loadSavedCustomFonts();
  }, []);

  // Load IndexedDB documents on mount
  useEffect(() => {
    async function loadData() {
      try {
        const docs = await getAllDocuments();
        if (docs.length > 0) {
          setDocuments(docs);
          setCurrentDoc(docs[0]);
        }
      } catch (err) {
        console.error('Error initializing storage:', err);
      }
    }
    loadData();
  }, []);

  // Update Document handler with auto-save
  const handleUpdateDocument = useCallback(
    (updatedFields: Partial<KashurDocument>) => {
      const targetId = updatedFields.id || currentDoc.id;
      const timestamp = Date.now();

      setCurrentDoc((prev) => {
        const nextDoc = {
          ...prev,
          ...updatedFields,
          updatedAt: timestamp,
        };
        saveDocument(nextDoc);
        return nextDoc;
      });

      setDocuments((prevDocs) =>
        prevDocs.map((d) =>
          d.id === targetId
            ? {
                ...d,
                ...updatedFields,
                updatedAt: timestamp,
              }
            : d
        )
      );
    },
    [currentDoc.id]
  );

  // Rename Document
  const handleRenameDocument = useCallback((id: string, newTitle: string) => {
    setDocuments((prevDocs) => {
      return prevDocs.map((d) => {
        if (d.id === id) {
          const updated = { ...d, title: newTitle, updatedAt: Date.now() };
          saveDocument(updated);
          return updated;
        }
        return d;
      });
    });
    setCurrentDoc((prev) => (prev.id === id ? { ...prev, title: newTitle, updatedAt: Date.now() } : prev));
  }, []);

  // Duplicate Document
  const handleDuplicateDocument = useCallback((id: string) => {
    const target = documents.find((d) => d.id === id) || currentDoc;
    if (!target) return;
    const duplicated: KashurDocument = {
      ...target,
      id: `doc-${Date.now()}`,
      title: `${target.title || 'Untitled Document'} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveDocument(duplicated);
    setDocuments((prev) => [duplicated, ...prev]);
    setCurrentDoc(duplicated);
  }, [documents, currentDoc]);

  // Create New Document
  const handleNewDocument = () => {
    const newDoc: KashurDocument = {
      id: `doc-${Date.now()}`,
      title: 'New Document',
      content: '',
      spans: [],
      defaultStyle: DEFAULT_TEXT_STYLE,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveDocument(newDoc);
    setDocuments((prev) => [newDoc, ...prev]);
    setCurrentDoc(newDoc);
  };

  // Delete Handlers
  const handleDeleteDocument = async (id: string) => {
    await deleteDocument(id);
    const remaining = documents.filter((d) => d.id !== id);
    setDocuments(remaining);
    if (currentDoc.id === id && remaining.length > 0) {
      setCurrentDoc(remaining[0]);
    }
  };

  // Active View Tab State (Input Text vs Canvas)
  const [activeTab, setActiveTab] = useState<'input_text' | 'canvas'>('canvas');

  // Insert character from picker into editor
  const handleInsertCharFromPicker = (char: string) => {
    // Trigger editor event for cursor-accurate insertion with undo history
    window.dispatchEvent(new CustomEvent('app-insert-char', { detail: { char } }));
  };

  const handleAddTextLayer = () => {
    window.dispatchEvent(new CustomEvent('app-add-text-layer'));
  };

  return (
    <div className="w-full h-full h-[100dvh] max-h-[100dvh] bg-white text-stone-950 overflow-hidden font-sans relative flex flex-col selection:bg-emerald-100 selection:text-emerald-900 overscroll-none touch-none">
      {/* Top Application Header */}
      <Header
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onNewDocument={handleNewDocument}
        onOpenCharacterPicker={() => setIsCharPickerOpen(true)}
        onOpenTransliteration={() => setIsTransliterationOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

        {/* Main Kashmiri Writing & Typography Workspace */}
        <main className="flex-1 w-full flex flex-col overflow-hidden bg-white min-h-0">
          <KashmiriEditor
            document={currentDoc}
            onUpdateDocument={handleUpdateDocument}
            onOpenCharacterPicker={() => setIsCharPickerOpen(true)}
            onOpenExport={() => setIsExportOpen(true)}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            isFocusedWritingMode={isFocusedWritingMode}
            setIsFocusedWritingMode={setIsFocusedWritingMode}
            onHistoryChange={(undoable, redoable) => {
              setCanUndo(undoable);
              setCanRedo(redoable);
            }}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </main>

        {/* Kashmiri Character & Glyph Guide Modal */}
        <CharacterPickerModal
          isOpen={isCharPickerOpen}
          onClose={() => setIsCharPickerOpen(false)}
          onInsertChar={handleInsertCharFromPicker}
        />

        {/* Latin / English Transliteration Modal */}
        <TransliterationModal
          isOpen={isTransliterationOpen}
          onClose={() => setIsTransliterationOpen(false)}
          kashmiriText={currentDoc.content}
        />

        {/* Writing Export Modal (PNG, PDF, SVG, TXT, DOC) */}
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          targetElementId="kashmiri-canvas-document-sheet"
          projectTitle={currentDoc.title || 'Untitled Document'}
          rawUnicodeText={currentDoc.content}
          aspectRatio={currentDoc.canvasConfig?.aspectRatio || 'a4'}
          currentOrientation={currentDoc.canvasConfig?.orientation || 'portrait'}
          document={currentDoc}
        />

        {/* Documents & Drafts Drawer */}
        <ProjectsDrawer
          isOpen={isProjectsOpen}
          onClose={() => setIsProjectsOpen(false)}
          documents={documents}
          currentDocId={currentDoc.id}
          onSelectDocument={(doc) => setCurrentDoc(doc)}
          onNewDocument={handleNewDocument}
          onDeleteDocument={handleDeleteDocument}
          onRenameDocument={handleRenameDocument}
          onDuplicateDocument={handleDuplicateDocument}
          onExportDocument={(doc) => {
            setCurrentDoc(doc);
            setIsProjectsOpen(false);
            setIsExportOpen(true);
          }}
          onCheckForUpdates={handleManualCheckUpdates}
        />

        {/* Automatic APK Update Checker Modal */}
        <UpdateAvailableModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          releaseInfo={updateReleaseInfo}
        />
    </div>
  );
}

