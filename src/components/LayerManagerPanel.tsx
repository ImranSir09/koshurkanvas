import React, { useState } from 'react';
import { TextLayer } from '../types';
import { LayerAlignmentType } from '../lib/layerUtils';
import {
  Layers,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Copy,
  Type,
  X,
  FolderPlus,
  FolderMinus,
  Folder,
  CheckSquare,
  Square,
  GitMerge,
  AlignCenter,
  AlignLeft,
  AlignRight,
  MoveVertical,
  MoveHorizontal,
} from 'lucide-react';

interface LayerManagerPanelProps {
  layers: TextLayer[];
  activeLayerId: string | null;
  selectedLayerIds?: string[];
  onSelectLayer: (layerId: string, isMultiSelect?: boolean) => void;
  onToggleSelectLayer?: (layerId: string) => void;
  onSelectAllLayers?: () => void;
  onClearSelection?: () => void;
  onGroupLayers?: (layerIds: string[]) => void;
  onUngroupLayers?: (groupId: string) => void;
  onMergeLayers?: (layerIds: string[]) => void;
  onAlignLayers?: (
    layerIds: string[],
    alignment: LayerAlignmentType
  ) => void;
  onDeleteSelectedLayers?: (layerIds: string[]) => void;
  onAddTextLayer: () => void;
  onUpdateLayer: (layerId: string, updates: Partial<TextLayer>) => void;
  onDuplicateLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onMoveLayerUp: (layerId: string) => void;
  onMoveLayerDown: (layerId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const LayerManagerPanel: React.FC<LayerManagerPanelProps> = ({
  layers,
  activeLayerId,
  selectedLayerIds = [],
  onSelectLayer,
  onToggleSelectLayer,
  onSelectAllLayers,
  onClearSelection,
  onGroupLayers,
  onUngroupLayers,
  onMergeLayers,
  onAlignLayers,
  onDeleteSelectedLayers,
  onAddTextLayer,
  onUpdateLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onMoveLayerUp,
  onMoveLayerDown,
  isOpen,
  onClose,
}) => {
  const [showAlignMenu, setShowAlignMenu] = useState<boolean>(false);

  if (!isOpen) return null;

  // Sorted by zIndex descending for display (top layer first)
  const sortedLayers = [...layers].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));

  // Multi-selection state: active ONLY when 2 or more layer checkboxes are selected
  const isMultiSelectionActive = selectedLayerIds.length >= 2;

  // Check if any selected layer is in a group
  const hasGroupedSelection = selectedLayerIds.some((id) => {
    const l = layers.find((layer) => layer.id === id);
    return !!l?.groupId;
  });

  const handleMergeAction = () => {
    if (onMergeLayers && selectedLayerIds.length >= 2) {
      onMergeLayers(selectedLayerIds);
      setShowAlignMenu(false);
    }
  };

  const handleGroupAction = () => {
    if (onGroupLayers && selectedLayerIds.length >= 2) {
      onGroupLayers(selectedLayerIds);
      setShowAlignMenu(false);
    }
  };

  const handleUngroupSelectedAction = () => {
    if (onUngroupLayers) {
      const groupIds = new Set<string>();
      selectedLayerIds.forEach((id) => {
        const l = layers.find((layer) => layer.id === id);
        if (l?.groupId) {
          groupIds.add(l.groupId);
        }
      });
      groupIds.forEach((groupId) => onUngroupLayers(groupId));
      setShowAlignMenu(false);
    }
  };

  const handleDeleteMultiAction = () => {
    if (onDeleteSelectedLayers && selectedLayerIds.length > 0) {
      onDeleteSelectedLayers(selectedLayerIds);
      setShowAlignMenu(false);
    } else if (selectedLayerIds.length > 0) {
      selectedLayerIds.forEach((id) => onDeleteLayer(id));
      setShowAlignMenu(false);
    }
  };

  const handleAlignAction = (alignment: LayerAlignmentType) => {
    if (onAlignLayers && selectedLayerIds.length >= 2) {
      onAlignLayers(selectedLayerIds, alignment);
    }
  };

  return (
    <div
      id="layers-manager-panel"
      className="absolute top-12 left-3 sm:left-4 z-40 w-80 max-h-[calc(100dvh-5.5rem)] bg-white rounded-2xl shadow-2xl border-2 border-stone-300 p-3 flex flex-col gap-2.5 animate-in slide-in-from-top-2 overflow-hidden select-none"
      dir="ltr"
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-300 shrink-0">
        <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
          <Layers size={18} className="text-emerald-700" />
          <span className="font-sans text-stone-900 text-sm font-semibold">Layers</span>
          <span className="text-[11px] font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
            {layers.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Select All / Deselect All Toggle */}
          {selectedLayerIds.length > 0 ? (
            <button
              type="button"
              onClick={onClearSelection}
              className="px-2 py-1 rounded-lg text-xs font-sans font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Clear Selection"
            >
              Clear
            </button>
          ) : (
            onSelectAllLayers && layers.length > 1 && (
              <button
                type="button"
                onClick={onSelectAllLayers}
                className="px-2 py-1 rounded-lg text-xs font-sans font-medium text-stone-600 hover:text-emerald-800 hover:bg-stone-100 transition-colors cursor-pointer"
                title="Select All"
              >
                All
              </button>
            )
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center transition-colors cursor-pointer border border-stone-300"
            title="Close"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 2. Layers Scrollable List */}
      <div className="flex flex-col gap-1.5 max-h-72 sm:max-h-84 overflow-y-auto custom-scrollbar touch-pan-y overscroll-contain pr-0.5 flex-1 min-h-0">
        {sortedLayers.map((layer, index) => {
          const isSelected = selectedLayerIds.includes(layer.id) || layer.id === activeLayerId;
          const isChecked = selectedLayerIds.includes(layer.id);
          const snippet = layer.text.slice(0, 24) || 'Empty Text Layer';
          const isGrouped = !!layer.groupId;

          return (
            <div
              key={layer.id}
              onClick={(e) => {
                const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
                onSelectLayer(layer.id, isMulti);
              }}
              className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                isChecked
                  ? 'bg-emerald-100/80 border-emerald-600 ring-2 ring-emerald-600/30'
                  : isSelected
                  ? 'bg-emerald-50/70 border-emerald-400'
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
              }`}
            >
              {/* Checkbox for Multi-Select */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleSelectLayer) {
                    onToggleSelectLayer(layer.id);
                  } else {
                    onSelectLayer(layer.id, true);
                  }
                }}
                className="w-8 h-8 -my-1 -mx-0.5 rounded-lg flex items-center justify-center text-stone-500 hover:text-emerald-700 shrink-0 cursor-pointer active:scale-95 transition-all"
                title={isChecked ? 'Deselect Layer' : 'Select Layer'}
                aria-label={isChecked ? 'Deselect Layer' : 'Select Layer'}
              >
                {isChecked ? (
                  <CheckSquare size={17} className="text-emerald-700" />
                ) : (
                  <Square size={17} className="text-stone-400 hover:text-stone-600" />
                )}
              </button>

              {/* Layer Info */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {isGrouped ? (
                  <Folder size={14} className="text-amber-700 shrink-0" title="Grouped Layer" />
                ) : (
                  <Type
                    size={14}
                    className={isChecked ? 'text-emerald-800 shrink-0 font-bold' : 'text-stone-600 shrink-0'}
                  />
                )}
                <span className="text-xs text-stone-900 font-medium truncate block font-sans">
                  {snippet}
                </span>
              </div>

              {/* Action Buttons: Icons Only */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* Move Up */}
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onMoveLayerUp(layer.id)}
                  className="w-6 h-6 rounded-lg bg-white border border-stone-300 flex items-center justify-center text-stone-800 hover:text-black hover:bg-stone-200 disabled:opacity-20 transition-colors cursor-pointer"
                  title="Move Up"
                  aria-label="Move Up"
                >
                  <ArrowUp size={13} />
                </button>

                {/* Move Down */}
                <button
                  type="button"
                  disabled={index === sortedLayers.length - 1}
                  onClick={() => onMoveLayerDown(layer.id)}
                  className="w-6 h-6 rounded-lg bg-white border border-stone-300 flex items-center justify-center text-stone-800 hover:text-black hover:bg-stone-200 disabled:opacity-20 transition-colors cursor-pointer"
                  title="Move Down"
                  aria-label="Move Down"
                >
                  <ArrowDown size={13} />
                </button>

                {/* Duplicate */}
                <button
                  type="button"
                  onClick={() => onDuplicateLayer(layer.id)}
                  className="w-6 h-6 rounded-lg bg-white border border-stone-300 flex items-center justify-center text-stone-800 hover:text-black hover:bg-stone-200 transition-colors cursor-pointer"
                  title="Duplicate"
                  aria-label="Duplicate"
                >
                  <Copy size={13} />
                </button>

                {/* Lock Toggle */}
                <button
                  type="button"
                  onClick={() => onUpdateLayer(layer.id, { isLocked: !layer.isLocked })}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                    layer.isLocked
                      ? 'bg-amber-100 border-amber-400 text-amber-900'
                      : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-200'
                  }`}
                  title={layer.isLocked ? 'Unlock Layer' : 'Lock Layer'}
                  aria-label="Lock/Unlock"
                >
                  {layer.isLocked ? <Lock size={13} /> : <Unlock size={13} />}
                </button>

                {/* Hide / Show Toggle */}
                <button
                  type="button"
                  onClick={() => onUpdateLayer(layer.id, { isHidden: !layer.isHidden })}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                    layer.isHidden
                      ? 'bg-rose-100 border-rose-400 text-rose-900'
                      : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-200'
                  }`}
                  title={layer.isHidden ? 'Show Layer' : 'Hide Layer'}
                  aria-label="Show/Hide"
                >
                  {layer.isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>

                {/* Ungroup (on layer instead of delete option) */}
                <button
                  type="button"
                  disabled={!isGrouped}
                  onClick={() => isGrouped && onUngroupLayers && onUngroupLayers(layer.groupId!)}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                    isGrouped
                      ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 hover:border-amber-400 shadow-2xs'
                      : 'bg-stone-50 border-stone-200 text-stone-300 opacity-40 cursor-not-allowed'
                  }`}
                  title={isGrouped ? 'Ungroup Layer' : 'Ungroup (Not in group)'}
                  aria-label="Ungroup Layer"
                >
                  <FolderMinus size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Bottom Control Section */}
      {/* Case A: In Multi-Selection State (2+ layers checked) -> Compact Action Bar with Icons Only */}
      {isMultiSelectionActive ? (
        <div className="flex flex-col gap-2 pt-1 border-t border-stone-200 shrink-0">
          {/* Alignment Popover (When Align is toggled) */}
          {showAlignMenu && (
            <div className="p-2 bg-stone-100 rounded-xl border border-stone-300 flex items-center justify-between gap-1 animate-in fade-in-50 zoom-in-95">
              <span className="text-[11px] font-bold text-stone-700 pl-1 shrink-0 font-sans">
                Align:
              </span>
              <div className="flex items-center gap-1 flex-1 justify-around">
                <button
                  type="button"
                  onClick={() => handleAlignAction('left')}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-800 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Align Left"
                  aria-label="Align Left"
                >
                  <AlignLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignAction('center')}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-800 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Align Center"
                  aria-label="Align Center"
                >
                  <AlignCenter size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignAction('right')}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-800 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Align Right"
                  aria-label="Align Right"
                >
                  <AlignRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignAction('top')}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-800 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Align Top"
                  aria-label="Align Top"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignAction('middle')}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-800 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Align Middle"
                  aria-label="Align Middle"
                >
                  <MoveVertical size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignAction('bottom')}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-800 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Align Bottom"
                  aria-label="Align Bottom"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignAction('distribute-h')}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-800 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Distribute Horizontally"
                  aria-label="Distribute Horizontally"
                >
                  <MoveHorizontal size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignAction('distribute-v')}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-800 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Distribute Vertically"
                  aria-label="Distribute Vertically"
                >
                  <MoveVertical size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Canva-style Compact Multi-Selection Bottom Action Bar - Icons Only */}
          <div
            id="layers-multi-selection-action-bar"
            className="flex items-center justify-between gap-1.5 p-1.5 bg-stone-100/90 border border-stone-300 rounded-xl shadow-xs"
          >
            {/* Action 1: Merge */}
            <button
              type="button"
              id="btn-layer-multi-merge"
              onClick={handleMergeAction}
              className="flex-1 py-2 rounded-lg bg-white hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 border border-stone-300 hover:border-emerald-500 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Merge Selected Layers"
              aria-label="Merge Selected Layers"
            >
              <GitMerge size={17} className="text-emerald-700" />
            </button>

            {/* Action 2: Group */}
            <button
              type="button"
              id="btn-layer-multi-group"
              onClick={handleGroupAction}
              className="flex-1 py-2 rounded-lg bg-white hover:bg-indigo-50 text-stone-800 hover:text-indigo-900 border border-stone-300 hover:border-indigo-500 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Group Selected Layers"
              aria-label="Group Selected Layers"
            >
              <FolderPlus size={17} className="text-indigo-700" />
            </button>

            {/* Action 3: Ungroup (if any selected layer is in a group) */}
            {hasGroupedSelection && (
              <button
                type="button"
                id="btn-layer-multi-ungroup"
                onClick={handleUngroupSelectedAction}
                className="flex-1 py-2 rounded-lg bg-white hover:bg-amber-50 text-stone-800 hover:text-amber-900 border border-stone-300 hover:border-amber-400 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Ungroup Selected"
                aria-label="Ungroup Selected"
              >
                <FolderMinus size={17} className="text-amber-700" />
              </button>
            )}

            {/* Action 4: Align */}
            <button
              type="button"
              id="btn-layer-multi-align"
              onClick={() => setShowAlignMenu(!showAlignMenu)}
              className={`flex-1 py-2 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 ${
                showAlignMenu
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-300'
              }`}
              title="Align Selected Layers"
              aria-label="Align Selected Layers"
            >
              <AlignCenter size={17} className={showAlignMenu ? 'text-white' : 'text-stone-700'} />
            </button>

            {/* Action 5: Delete */}
            <button
              type="button"
              id="btn-layer-multi-delete"
              onClick={handleDeleteMultiAction}
              className="flex-1 py-2 rounded-lg bg-white hover:bg-rose-50 text-stone-800 hover:text-rose-900 border border-stone-300 hover:border-rose-400 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Delete Selected Layers"
              aria-label="Delete Selected Layers"
            >
              <Trash2 size={17} className="text-rose-600" />
            </button>
          </div>
        </div>
      ) : (
        /* Case B: Default State (< 2 layers checked) -> Refined "+ (Add text layer)" Control */
        <button
          type="button"
          id="btn-add-layer-bottom"
          onClick={onAddTextLayer}
          className="w-full py-2 px-3 rounded-xl border border-dashed border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-semibold font-sans text-xs shrink-0 active:scale-98"
          title="Add Text Layer"
          aria-label="Add text layer"
        >
          <Plus size={15} className="text-emerald-700" />
          <span>(Add text layer)</span>
        </button>
      )}
    </div>
  );
};
