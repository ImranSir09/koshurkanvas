import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpen,
  Download,
  RotateCcw,
  RotateCw,
  Edit2,
  Smartphone,
  CloudCheck,
} from 'lucide-react';

interface HeaderProps {
  currentDocTitle?: string;
  onRenameDocument?: (newTitle: string) => void;
  onOpenProjects: () => void;
  onOpenExport: () => void;
  onOpenAndroidApp?: () => void;
  onNewDocument?: () => void;
  onOpenCharacterPicker?: () => void;
  onOpenTransliteration?: () => void;
  layoutMode?: 'desktop' | 'phone';
  onToggleLayoutMode?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentDocTitle = 'کٲشُر مسودہ',
  onRenameDocument,
  onOpenProjects,
  onOpenExport,
  onOpenAndroidApp,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(currentDocTitle);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTitleInput(currentDocTitle);
  }, [currentDocTitle]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleFinishTitleEdit = () => {
    setIsEditingTitle(false);
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== currentDocTitle && onRenameDocument) {
      onRenameDocument(trimmed);
    } else {
      setTitleInput(currentDocTitle);
    }
  };

  return (
    <header
      id="app-main-header"
      className="w-full bg-white border-b border-stone-300 px-3 sm:px-4 h-12 sm:h-13 flex items-center justify-between gap-2 select-none z-30 shrink-0 shadow-2xs backdrop-blur-md relative"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 0.2rem)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 0.75rem)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 0.75rem)',
      }}
      dir="rtl"
    >
      {/* Right / Start (in RTL): Projects Drawer Button & Title */}
      <div className="flex items-center gap-2 shrink-0 min-w-0 flex-1">
        {/* Projects / Drawer Icon Button */}
        <button
          id="header-projects-btn"
          type="button"
          onClick={onOpenProjects}
          className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg text-stone-900 hover:text-emerald-950 bg-stone-100 hover:bg-emerald-100 border border-stone-300 hover:border-emerald-500 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs"
          title="محفوظ مسودات (Projects & Files)"
          aria-label="Projects"
        >
          <FolderOpen size={16} className="text-emerald-800" />
        </button>

        {/* Editable Document Title */}
        <div className="flex items-center gap-1.5 min-w-0 max-w-[160px] sm:max-w-[280px] md:max-w-[360px]">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleFinishTitleEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishTitleEdit();
                if (e.key === 'Escape') {
                  setTitleInput(currentDocTitle);
                  setIsEditingTitle(false);
                }
              }}
              className="px-2 py-0.5 bg-white border-2 border-emerald-600 rounded-md font-nastaliq text-xs text-stone-950 font-bold outline-none ring-2 ring-emerald-600/20 w-full"
              dir="rtl"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-stone-100 transition-colors text-right truncate cursor-pointer group min-w-0"
              title="Click to rename document"
            >
              <span className="font-nastaliq text-xs font-bold text-stone-950 truncate leading-tight">
                {currentDocTitle}
              </span>
              <Edit2 size={12} className="text-stone-500 group-hover:text-emerald-700 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          {/* Firebase Cloud Saved status indicator */}
          <div 
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-950 text-[10px] font-sans font-bold border border-emerald-300 shrink-0 shadow-2xs"
            title="Automatically saved to Local Database and Firebase Firestore Cloud"
          >
            <CloudCheck size={13} className="text-emerald-700" />
            <span className="hidden sm:inline leading-none">Firebase Saved</span>
            <span className="sm:hidden leading-none">Saved</span>
          </div>
        </div>
      </div>

      {/* Left / End (in RTL): Icon-Only Undo, Redo, Export */}
      <div className="flex items-center gap-1.5 shrink-0" dir="ltr">
        {/* Undo */}
        {onUndo && (
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg text-stone-900 hover:text-black bg-stone-100 hover:bg-stone-200 border border-stone-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
            title="Undo"
            aria-label="Undo"
          >
            <RotateCcw size={15} />
          </button>
        )}

        {/* Redo */}
        {onRedo && (
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg text-stone-900 hover:text-black bg-stone-100 hover:bg-stone-200 border border-stone-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
            title="Redo"
            aria-label="Redo"
          >
            <RotateCw size={15} />
          </button>
        )}

        {/* Android App APK Button */}
        {onOpenAndroidApp && (
          <button
            id="header-android-app-btn"
            type="button"
            onClick={onOpenAndroidApp}
            className="h-8.5 sm:h-9 px-2 sm:px-2.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs font-sans text-xs font-bold"
            title="Android App & APK Setup"
            aria-label="Android App"
          >
            <Smartphone size={15} className="text-emerald-800" />
            <span className="hidden md:inline">Android App</span>
          </button>
        )}

        {/* Primary Export Icon Button */}
        <button
          id="header-export-btn"
          type="button"
          onClick={onOpenExport}
          className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs shrink-0 border border-emerald-800"
          title="Export (PNG, PDF, SVG, TXT)"
          aria-label="Export"
        >
          <Download size={16} />
        </button>
      </div>
    </header>
  );
};

