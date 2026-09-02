import React from 'react';
import {
  FolderOpen,
  Download,
  RotateCcw,
  RotateCw,
  Type,
  Layout,
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
  activeTab?: 'input_text' | 'canvas';
  onTabChange?: (tab: 'input_text' | 'canvas') => void;
  onAddTextLayer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenProjects,
  onOpenExport,
  activeTab = 'canvas',
  onTabChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
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
      className="w-full bg-[#FAF8F5]/95 border-b border-stone-200/80 px-2 sm:px-3 py-1.5 flex items-center justify-between gap-1.5 select-none z-30 shrink-0 shadow-2xs backdrop-blur-md relative"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 0.35rem)',
        paddingBottom: '0.35rem',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 0.5rem)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 0.5rem)',
      }}
      dir="ltr"
    >
      {/* Left Action: Projects Folder Button */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          id="header-projects-btn"
          type="button"
          onClick={onOpenProjects}
          className="w-9 h-8 sm:w-9.5 sm:h-8.5 rounded-xl text-stone-800 hover:text-emerald-950 bg-stone-100 hover:bg-emerald-50 border border-stone-200/90 hover:border-emerald-500/80 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs"
          title="Projects & Saved Files"
          aria-label="Projects"
        >
          <FolderOpen size={16} className="text-emerald-800" />
        </button>
      </div>

      {/* Center Group: Tab Switcher (Input Text / Canvas) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Main Two-Tab Switcher: [Input Text] | [Canvas] */}
        {onTabChange && (
          <div className="flex items-center gap-0.5 bg-stone-200/60 p-0.5 rounded-xl border border-stone-300/60 shrink-0">
            <button
              id="tab-input-text"
              type="button"
              onClick={() => onTabChange('input_text')}
              className={`w-9 h-7.5 sm:w-10 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'input_text'
                  ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-stone-200/60'
              }`}
              title="Input Text"
              aria-label="Input Text"
            >
              <Type size={16} />
            </button>

            <button
              id="tab-canvas"
              type="button"
              onClick={() => onTabChange('canvas')}
              className={`w-9 h-7.5 sm:w-10 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'canvas'
                  ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-stone-200/60'
              }`}
              title="Canvas Stage"
              aria-label="Canvas Stage"
            >
              <Layout size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Right Actions: Undo, Redo, Export */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Undo / Redo Group */}
        <div className="flex items-center gap-0.5 bg-stone-200/60 p-0.5 rounded-xl border border-stone-300/60 shrink-0">
          <button
            id="header-undo-btn"
            type="button"
            onClick={handleTriggerUndo}
            disabled={!canUndo}
            className="w-8 h-7 sm:w-8.5 sm:h-7.5 rounded-lg flex items-center justify-center transition-all cursor-pointer text-stone-700 hover:text-black hover:bg-stone-200 disabled:opacity-30 disabled:pointer-events-none"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <RotateCcw size={15} />
          </button>

          <button
            id="header-redo-btn"
            type="button"
            onClick={handleTriggerRedo}
            disabled={!canRedo}
            className="w-8 h-7 sm:w-8.5 sm:h-7.5 rounded-lg flex items-center justify-center transition-all cursor-pointer text-stone-700 hover:text-black hover:bg-stone-200 disabled:opacity-30 disabled:pointer-events-none"
            title="Redo (Ctrl+Shift+Z / Ctrl+Y)"
            aria-label="Redo"
          >
            <RotateCw size={15} />
          </button>
        </div>

        {/* Primary Export Icon Button */}
        <button
          id="header-export-btn"
          type="button"
          onClick={onOpenExport}
          className="w-9 h-7.5 sm:w-9.5 sm:h-8 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs shrink-0 border border-emerald-800"
          title="Export (PNG, PDF, SVG, TXT)"
          aria-label="Export"
        >
          <Download size={16} />
        </button>
      </div>
    </header>
  );
};



