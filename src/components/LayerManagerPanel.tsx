import React, { useState } from 'react';
import { TextLayer } from '../types';
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
  ChevronDown,
  ChevronUp,
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
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
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
  const [collapsedGroups, setCollapsedGroups] = useState<{ [groupId: string]: boolean }>({});

  if (!isOpen) return null;

  // Sorted by zIndex descending for display (top layer first)
  const sortedLayers = [...layers].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));

  // Multi-selection state: active ONLY when 2 or more layer checkboxes are selected
  const isMultiSelectionActive = selectedLayerIds.length >= 2;
  const selectedCount = selectedLayerIds.length;

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

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

  const handleDeleteMultiAction = () => {
    if (onDeleteSelectedLayers && selectedLayerIds.length > 0) {
      onDeleteSelectedLayers(selectedLayerIds);
      setShowAlignMenu(false);
    } else if (selectedLayerIds.length > 0) {
      selectedLayerIds.forEach((id) => onDeleteLayer(id));
      setShowAlignMenu(false);
    }
  };

  const handleAlignAction = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (onAlignLayers && selectedLayerIds.length >= 2) {
      onAlignLayers(selectedLayerIds, alignment);
    }
  };

  // Grouped structure rendering helper
  // Collect group IDs
  const groupIds = Array.from(new Set(layers.filter((l) => l.groupId).map((l) => l.groupId!)));

  return (
    <div
      id="kashmiri-layers-manager-panel"
      className="absolute top-12 left-3 sm:left-4 z-40 w-84 max-h-[calc(100dvh-5.5rem)] bg-white rounded-2xl shadow-2xl border-2 border-stone-300 p-3 flex flex-col gap-2.5 animate-in slide-in-from-top-2 overflow-hidden select-none"
      dir="rtl"
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-300 shrink-0">
        <div className="flex items-center gap-2 text-stone-950 font-bold text-sm">
          <Layers size={18} className="text-emerald-700" />
          <span className="font-nastaliq text-stone-900 text-sm">لئیر منیجر</span>
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
              className="px-2 py-1 rounded-lg text-xs font-sans text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Clear Selection (خارج کٔرِو)"
            >
              خارج کٔرِو
            </button>
          ) : (
            onSelectAllLayers && layers.length > 1 && (
              <button
                type="button"
                onClick={onSelectAllLayers}
                className="px-2 py-1 rounded-lg text-xs font-sans text-stone-600 hover:text-emerald-800 hover:bg-stone-100 transition-colors cursor-pointer"
                title="Select All (تمام منتخب کٔرِو)"
              >
                تمام
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
          const snippet = layer.text.slice(0, 24) || 'خالی متن';
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
              {/* Checkbox for Multi-Select (Large 36x36 touch target) */}
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
                className="w-9 h-9 -my-1 -mx-0.5 rounded-lg flex items-center justify-center text-stone-500 hover:text-emerald-700 shrink-0 cursor-pointer active:scale-95 transition-all"
                title={isChecked ? 'Deselect Layer' : 'Select Layer'}
                aria-label={isChecked ? 'Deselect Layer' : 'Select Layer'}
              >
                {isChecked ? (
                  <CheckSquare size={18} className="text-emerald-700" />
                ) : (
                  <Square size={18} className="text-stone-400 hover:text-stone-600" />
                )}
              </button>

              {/* Layer Info */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {isGrouped ? (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold shrink-0">
                    <Folder size={11} className="text-amber-700" />
                    <span>گروپ</span>
                  </span>
                ) : (
                  <Type
                    size={14}
                    className={isChecked ? 'text-emerald-800 shrink-0 font-bold' : 'text-stone-600 shrink-0'}
                  />
                )}
                <span className="text-xs font-nastaliq text-stone-900 font-bold truncate block">
                  {snippet}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* Ungroup button if layer is in a group */}
                {isGrouped && onUngroupLayers && (
                  <button
                    type="button"
                    onClick={() => onUngroupLayers(layer.groupId!)}
                    className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-300 hover:bg-amber-100 flex items-center justify-center text-amber-800 transition-colors cursor-pointer"
                    title="Ungroup Layer (گروپ الگ کٔرِو)"
                    aria-label="Ungroup Layer"
                  >
                    <FolderMinus size={13} />
                  </button>
                )}

                {/* Move Up */}
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onMoveLayerUp(layer.id)}
                  className="w-6 h-6 rounded-lg bg-white border border-stone-300 flex items-center justify-center text-stone-800 hover:text-black hover:bg-stone-200 disabled:opacity-20 transition-colors cursor-pointer"
                  title="Move Up (اوپر)"
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
                  title="Move Down (نیچے)"
                  aria-label="Move Down"
                >
                  <ArrowDown size={13} />
                </button>

                {/* Duplicate */}
                <button
                  type="button"
                  onClick={() => onDuplicateLayer(layer.id)}
                  className="w-6 h-6 rounded-lg bg-white border border-stone-300 flex items-center justify-center text-stone-800 hover:text-black hover:bg-stone-200 transition-colors cursor-pointer"
                  title="Duplicate (نقل)"
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
                  title={layer.isLocked ? 'Unlock Layer (لاک کھولیں)' : 'Lock Layer (لاک کٔرِو)'}
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
                  title={layer.isHidden ? 'Show Layer (دکھائیں)' : 'Hide Layer (چھپاؤ)'}
                  aria-label="Show/Hide"
                >
                  {layer.isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>

                {/* Delete */}
                <button
                  type="button"
                  disabled={layers.length <= 1}
                  onClick={() => onDeleteLayer(layer.id)}
                  className="w-6 h-6 rounded-lg bg-white border border-stone-300 hover:border-rose-400 flex items-center justify-center text-stone-700 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-20 transition-colors cursor-pointer"
                  title="Delete Layer (حذف)"
                  aria-label="Delete Layer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Bottom Control Section */}
      {/* Case A: In Multi-Selection State (2+ layers checked) -> Compact Canva-style Action Bar */}
      {isMultiSelectionActive ? (
        <div className="flex flex-col gap-2 pt-1 border-t border-stone-200 shrink-0">
          {/* Alignment Popover (When Align is toggled) */}
          {showAlignMenu && (
            <div className="p-2 bg-stone-100 rounded-xl border border-stone-300 flex items-center justify-between gap-1 animate-in fade-in-50 zoom-in-95">
              <span className="text-[11px] font-bold font-nastaliq text-stone-700 pl-1 shrink-0">
                برابر:
              </span>
              <div className="flex items-center gap-1 flex-1 justify-around" dir="ltr">
                <button
                  type="button"
                  onClick={() => handleAlignAction('left')}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-800 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Align Left (کھور طرف)"
                  aria-label="Align Left"
                >
                  <AlignLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignAction('center')}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-800 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Align Center (درمیان)"
                  aria-label="Align Center"
                >
                  <AlignCenter size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignAction('right')}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-800 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Align Right (دچھن طرف)"
                  aria-label="Align Right"
                >
                  <AlignRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignAction('top')}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-800 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Align Top (اوپر)"
                  aria-label="Align Top"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignAction('middle')}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-800 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Align Middle (درمیان عمودی)"
                  aria-label="Align Middle"
                >
                  <MoveVertical size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignAction('bottom')}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-800 text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                  title="Align Bottom (نیچے)"
                  aria-label="Align Bottom"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Canva-style Compact Multi-Selection Bottom Action Bar */}
          <div
            id="layers-multi-selection-action-bar"
            className="flex items-center justify-between gap-1.5 p-1.5 bg-stone-100/90 border border-stone-300 rounded-xl shadow-xs"
            dir="rtl"
          >
            {/* Action 1: Merge (مدغم کٔرِو) */}
            <button
              type="button"
              id="btn-layer-multi-merge"
              onClick={handleMergeAction}
              className="flex-1 py-2 px-2 rounded-lg bg-white hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 border border-stone-300 hover:border-emerald-500 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs font-nastaliq text-xs font-bold active:scale-95"
              title="Merge selected layers into one editable text layer (مدغم کٔرِو)"
              aria-label="Merge Selected Layers"
            >
              <GitMerge size={14} className="text-emerald-700 shrink-0" />
              <span>مدغم</span>
            </button>

            {/* Action 2: Group (گروپ بَنائِو) */}
            <button
              type="button"
              id="btn-layer-multi-group"
              onClick={handleGroupAction}
              className="flex-1 py-2 px-2 rounded-lg bg-white hover:bg-indigo-50 text-stone-800 hover:text-indigo-900 border border-stone-300 hover:border-indigo-500 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs font-nastaliq text-xs font-bold active:scale-95"
              title="Group selected layers (گروپ بَنائِو)"
              aria-label="Group Selected Layers"
            >
              <FolderPlus size={14} className="text-indigo-700 shrink-0" />
              <span>گروپ</span>
            </button>

            {/* Action 3: Align (برابر کٔرِو) */}
            <button
              type="button"
              id="btn-layer-multi-align"
              onClick={() => setShowAlignMenu(!showAlignMenu)}
              className={`flex-1 py-2 px-2 rounded-lg border flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs font-nastaliq text-xs font-bold active:scale-95 ${
                showAlignMenu
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-300'
              }`}
              title="Align selected layers (برابر کٔرِو)"
              aria-label="Align Selected Layers"
            >
              <AlignCenter size={14} className={showAlignMenu ? 'text-white' : 'text-stone-700'} />
              <span>برابر</span>
            </button>

            {/* Action 4: Delete (ختم کٔرِو / حذف) */}
            <button
              type="button"
              id="btn-layer-multi-delete"
              onClick={handleDeleteMultiAction}
              className="flex-1 py-2 px-2 rounded-lg bg-white hover:bg-rose-50 text-stone-800 hover:text-rose-900 border border-stone-300 hover:border-rose-400 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs font-nastaliq text-xs font-bold active:scale-95"
              title="Delete all selected layers (حذف)"
              aria-label="Delete Selected Layers"
            >
              <Trash2 size={14} className="text-rose-600 shrink-0" />
              <span>حذف</span>
            </button>
          </div>
        </div>
      ) : (
        /* Case B: Default State (< 2 layers checked) -> Normal "Add Layer" Control */
        <button
          type="button"
          id="btn-add-layer-bottom"
          onClick={onAddTextLayer}
          className="w-full py-2 px-3 rounded-xl border-2 border-dashed border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-bold font-nastaliq text-xs shrink-0"
          title="Add New Text Layer (نواں لئیر)"
          aria-label="Add New Text Layer"
        >
          <Plus size={16} />
          <span>نواں لئیر شٲمِل کٔرِو (Add Layer)</span>
        </button>
      )}
    </div>
  );
};
