import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpen,
  Download,
  Edit2,
  CloudCheck,
  RotateCcw,
  RotateCw,
} from 'lucide-react';

interface HeaderProps {
  currentDocTitle?: string;
  onRenameDocument?: (newTitle: string) => void;
  onOpenProjects: () => void;
  onOpenExport: () => void;
  onNewDocument?: () => void;
  onOpenCharacterPicker?: () => void;
  onOpenTransliteration?: () => void;
  layoutMode?: 'desktop' | 'phone';
  onToggleLayoutMode?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDocTitle = 'Untitled Document',
  onRenameDocument,
  onOpenProjects,
  onOpenExport,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
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

  const handleTriggerUndo = () => {
    if (onUndo) {
      onUndo();
    } else {
      window.dispatchEvent(new CustomEvent('app-undo'));
    }
  };

  const handleTriggerRedo = () => {
    if (onRedo) {
      onRedo();
    } else {
      window.dispatchEvent(new CustomEvent('app-redo'));
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
      {/* Right / Start (in RTL): Brand, Projects Drawer Button & Title */}
      <div className="flex items-center gap-2 shrink-0 min-w-0 flex-1">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-stone-200 shrink-0 select-none">
          <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-sans font-black text-xs shadow-2xs">
            KK
          </div>
          <span className="font-sans font-bold text-xs tracking-tight text-stone-900 hidden md:inline whitespace-nowrap">
            Kashur Kanvas
          </span>
        </div>

        {/* Projects / Drawer Icon Button */}
        <button
          id="header-projects-btn"
          type="button"
          onClick={onOpenProjects}
          className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg text-stone-900 hover:text-emerald-950 bg-stone-100 hover:bg-emerald-100 border border-stone-300 hover:border-emerald-500 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs"
          title="Projects & Saved Files"
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

      {/* Action End (Undo, Redo, Export) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" dir="ltr">
        {/* Undo Button */}
        <button
          id="header-undo-btn"
          type="button"
          onClick={handleTriggerUndo}
          disabled={!canUndo}
          className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 hover:text-black flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow-2xs"
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <RotateCcw size={15} />
        </button>

        {/* Redo Button */}
        <button
          id="header-redo-btn"
          type="button"
          onClick={handleTriggerRedo}
          disabled={!canRedo}
          className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 hover:text-black flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow-2xs"
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          <RotateCw size={15} />
        </button>

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


