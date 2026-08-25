import React, { useState, useMemo } from 'react';
import {
  HistoryActionCategory,
  HistorySnapshot,
} from '../types';
import { formatHistoryRelativeTime } from '../lib/historyManager';
import {
  RotateCcw,
  RotateCw,
  History,
  Check,
  X,
  Type,
  Palette,
  Layers,
  Layout,
  Sparkles,
  ArrowDown,
  ArrowUp,
  FastForward,
  Rewind,
  Clock,
  Sliders,
  Filter,
} from 'lucide-react';

interface BatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: HistorySnapshot[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onBatchUndo: (steps: number) => void;
  onBatchRedo: (steps: number) => void;
  onJumpToSnapshot: (targetIndex: number) => void;
  onRevertToInitial: () => void;
}

export const BatchHistoryModal: React.FC<BatchHistoryModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  currentIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onBatchUndo,
  onBatchRedo,
  onJumpToSnapshot,
  onRevertToInitial,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<HistoryActionCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtered timeline items
  const filteredSnapshots = useMemo(() => {
    return snapshots.map((snap, idx) => ({ snap, originalIndex: idx })).filter(({ snap }) => {
      const matchesCategory = selectedCategory === 'all' || snap.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        snap.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (snap.docTitle && snap.docTitle.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [snapshots, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const pastCount = currentIndex;
  const futureCount = Math.max(0, snapshots.length - 1 - currentIndex);

  const getCategoryIcon = (category: HistoryActionCategory) => {
    switch (category) {
      case 'text_edit':
        return <Type size={14} className="text-blue-700" />;
      case 'format_style':
        return <Palette size={14} className="text-amber-700" />;
      case 'layer_add':
      case 'layer_delete':
      case 'layer_arrange':
      case 'layer_transform':
      case 'layer_group':
      case 'layer_align':
        return <Layers size={14} className="text-emerald-700" />;
      case 'canvas_layout':
        return <Layout size={14} className="text-purple-700" />;
      case 'batch_operation':
      case 'document_init':
      default:
        return <Sparkles size={14} className="text-indigo-700" />;
    }
  };

  const getCategoryBadgeClass = (category: HistoryActionCategory) => {
    switch (category) {
      case 'text_edit':
        return 'bg-blue-50 text-blue-900 border-blue-200';
      case 'format_style':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'layer_add':
      case 'layer_delete':
      case 'layer_arrange':
      case 'layer_transform':
      case 'layer_group':
      case 'layer_align':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      case 'canvas_layout':
        return 'bg-purple-50 text-purple-900 border-purple-200';
      default:
        return 'bg-stone-100 text-stone-900 border-stone-200';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs font-sans animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-stone-300 flex flex-col overflow-hidden text-stone-900 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        dir="ltr"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-stone-50 border-b border-stone-200 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0 shadow-2xs">
              <History size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-stone-950 tracking-tight">
                  History & Batch Revert
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 text-[10px] font-bold border border-emerald-300">
                  Step {currentIndex + 1} of {snapshots.length}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 truncate">
                Track all writing and layout changes with multi-step batch rollback
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 hover:text-black flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Close (Esc)"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Batch Actions Bar */}
        <div className="px-4 sm:px-5 py-2.5 bg-stone-100/90 border-b border-stone-200 flex items-center justify-between flex-wrap gap-2 shrink-0">
          {/* Batch Undo buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider select-none mr-1 hidden sm:inline">
              Batch Revert:
            </span>

            {/* Undo 1 Step */}
            <button
              type="button"
              disabled={!canUndo}
              onClick={onUndo}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-50 text-stone-900 border border-stone-300 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Undo 1 action (Ctrl+Z)"
            >
              <RotateCcw size={13} />
              <span>Undo 1</span>
            </button>

            {/* Batch Undo 3 Steps */}
            <button
              type="button"
              disabled={pastCount < 2}
              onClick={() => onBatchUndo(3)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-50 text-stone-900 border border-stone-300 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Undo last 3 actions at once"
            >
              <Rewind size={13} />
              <span>Undo 3</span>
            </button>

            {/* Batch Undo 5 Steps */}
            <button
              type="button"
              disabled={pastCount < 3}
              onClick={() => onBatchUndo(5)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-50 text-stone-900 border border-stone-300 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Undo last 5 actions at once"
            >
              <Rewind size={13} />
              <span>Undo 5</span>
            </button>

            {/* Revert to Initial */}
            <button
              type="button"
              disabled={pastCount === 0}
              onClick={onRevertToInitial}
              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Revert entire session back to initial document"
            >
              <RotateCcw size={13} className="text-amber-800" />
              <span>Revert to Start</span>
            </button>
          </div>

          {/* Batch Redo buttons */}
          <div className="flex items-center gap-1.5">
            {/* Redo 1 Step */}
            <button
              type="button"
              disabled={!canRedo}
              onClick={onRedo}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-50 text-stone-900 border border-stone-300 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Redo 1 action (Ctrl+Shift+Z)"
            >
              <RotateCw size={13} />
              <span>Redo 1</span>
            </button>

            {/* Batch Redo 3 Steps */}
            {futureCount > 1 && (
              <button
                type="button"
                onClick={() => onBatchRedo(3)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-50 text-stone-900 border border-stone-300 text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="Redo next 3 actions at once"
              >
                <FastForward size={13} />
                <span>Redo 3</span>
              </button>
            )}

            {/* Redo All */}
            {futureCount > 2 && (
              <button
                type="button"
                onClick={() => onBatchRedo(futureCount)}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="Restore all future actions"
              >
                <FastForward size={13} className="text-emerald-800" />
                <span>Redo All ({futureCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filters Bar */}
        <div className="px-4 sm:px-5 py-2 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar shrink-0">
          <div className="flex items-center gap-1 min-w-max">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
              }`}
            >
              All ({snapshots.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('text_edit')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedCategory === 'text_edit'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
              }`}
            >
              <Type size={12} />
              <span>Text</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('format_style')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedCategory === 'format_style'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
              }`}
            >
              <Palette size={12} />
              <span>Style</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('layer_transform')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedCategory === 'layer_transform'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
              }`}
            >
              <Layers size={12} />
              <span>Layers</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('canvas_layout')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedCategory === 'canvas_layout'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
              }`}
            >
              <Layout size={12} />
              <span>Layout</span>
            </button>
          </div>

          <div className="text-[11px] text-stone-500 font-mono shrink-0 hidden md:block">
            {pastCount} in past • {futureCount} in future
          </div>
        </div>

        {/* Timeline Snapshots List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 custom-scrollbar min-h-[260px] max-h-[460px] bg-stone-100/40">
          {filteredSnapshots.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <History size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No actions found for this filter</p>
            </div>
          ) : (
            filteredSnapshots.map(({ snap, originalIndex }) => {
              const isCurrent = originalIndex === currentIndex;
              const isPast = originalIndex < currentIndex;
              const isFuture = originalIndex > currentIndex;
              const stepsDiff = Math.abs(originalIndex - currentIndex);

              return (
                <div
                  key={snap.id}
                  onClick={() => {
                    if (!isCurrent) {
                      onJumpToSnapshot(originalIndex);
                    }
                  }}
                  className={`relative p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 group select-none ${
                    isCurrent
                      ? 'bg-emerald-50/90 border-2 border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                      : isPast
                      ? 'bg-white hover:bg-stone-50 border-stone-300 hover:border-emerald-400 shadow-2xs'
                      : 'bg-stone-50/80 hover:bg-stone-100 border-dashed border-stone-300 hover:border-emerald-400 opacity-75 hover:opacity-100'
                  }`}
                >
                  {/* Step Number & Category Icon */}
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-2xs ${
                        isCurrent
                          ? 'bg-emerald-700 text-white border-emerald-800'
                          : getCategoryBadgeClass(snap.category)
                      }`}
                    >
                      {isCurrent ? <Check size={14} className="stroke-[2.5]" /> : getCategoryIcon(snap.category)}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-stone-600">
                      #{originalIndex + 1}
                    </span>
                  </div>

                  {/* Action Content & Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`font-semibold text-xs sm:text-sm truncate ${
                            isCurrent ? 'text-emerald-950 font-bold' : 'text-stone-900'
                          }`}
                        >
                          {snap.description}
                        </span>

                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold shadow-2xs shrink-0">
                            Current Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-stone-600 shrink-0 font-sans">
                        <Clock size={11} className="opacity-70" />
                        <span>{formatHistoryRelativeTime(snap.timestamp)}</span>
                      </div>
                    </div>

                    {/* Metadata chips */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-stone-600 mt-1">
                      {snap.category && (
                        <span className="px-1.5 py-0.5 rounded-md bg-stone-200/80 font-medium capitalize">
                          {snap.category.replace('_', ' ')}
                        </span>
                      )}

                      {snap.meta?.fontSize && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-950 font-semibold">
                          {snap.meta.fontSize}px
                        </span>
                      )}

                      {snap.meta?.fontFamily && (
                        <span className="px-1.5 py-0.5 rounded-md bg-stone-200/80 font-sans truncate max-w-[120px]">
                          {snap.meta.fontFamily}
                        </span>
                      )}

                      {snap.textLayers && snap.textLayers.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-950 font-medium">
                          {snap.textLayers.length} {snap.textLayers.length === 1 ? 'Layer' : 'Layers'}
                        </span>
                      )}

                      {snap.canvasConfig?.aspectRatio && (
                        <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-950 font-semibold uppercase">
                          {snap.canvasConfig.aspectRatio}
                        </span>
                      )}

                      {snap.content && (
                        <span
                          className="px-1.5 py-0.5 rounded-md bg-stone-200/90 font-nastaliq text-xs text-stone-800 truncate max-w-[160px]"
                          dir="rtl"
                        >
                          {snap.content.slice(0, 30)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Jump / Revert Action Trigger on Hover */}
                  <div className="shrink-0 self-center">
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onJumpToSnapshot(originalIndex);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer ${
                          isPast
                            ? 'bg-stone-200 hover:bg-emerald-700 hover:text-white text-stone-800'
                            : 'bg-emerald-100 hover:bg-emerald-700 hover:text-white text-emerald-950'
                        }`}
                        title={isPast ? `Revert ${stepsDiff} action(s) to this state` : `Restore ${stepsDiff} action(s) to this state`}
                      >
                        {isPast ? <RotateCcw size={12} /> : <RotateCw size={12} />}
                        <span className="hidden sm:inline">
                          {isPast ? `Revert ${stepsDiff}` : `Restore ${stepsDiff}`}
                        </span>
                        <span className="sm:hidden">Jump</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-5 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-stone-800">
              {snapshots.length} total snapshots in history
            </span>
            <span className="hidden sm:inline text-stone-500">
              (Use <kbd className="px-1 py-0.5 bg-stone-200 rounded font-mono text-[10px]">Ctrl+Z</kbd> / <kbd className="px-1 py-0.5 bg-stone-200 rounded font-mono text-[10px]">Ctrl+Shift+Z</kbd>)
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
