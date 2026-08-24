import React from 'react';
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
} from 'lucide-react';

interface LayerManagerPanelProps {
  layers: TextLayer[];
  activeLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
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
  onSelectLayer,
  onAddTextLayer,
  onUpdateLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onMoveLayerUp,
  onMoveLayerDown,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  // Sorted by zIndex descending for display (top layer first)
  const sortedLayers = [...layers].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));

  return (
    <div
      className="absolute top-12 left-3 sm:left-4 z-40 w-72 bg-white rounded-2xl shadow-2xl border-2 border-stone-300 p-3 flex flex-col gap-2.5 animate-in slide-in-from-top-2"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-300">
        <div className="flex items-center gap-1.5 text-stone-950 font-bold text-sm">
          <Layers size={18} className="text-emerald-700" />
          <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
            {layers.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onAddTextLayer}
            className="w-8 h-8 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center transition-colors cursor-pointer border border-emerald-800 shadow-xs"
            title="Add Layer (نواں لئیر)"
            aria-label="Add Layer"
          >
            <Plus size={16} />
          </button>
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

      {/* Layers List */}
      <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-0.5">
        {sortedLayers.map((layer, index) => {
          const isSelected = layer.id === activeLayerId;
          const snippet = layer.text.slice(0, 24) || 'خالی متن';

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-100/70 border-emerald-600 ring-2 ring-emerald-600/30'
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-300'
              }`}
            >
              {/* Layer Info */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Type size={15} className={isSelected ? 'text-emerald-800 shrink-0 font-bold' : 'text-stone-700 shrink-0'} />
                <span className="text-xs font-nastaliq text-stone-900 font-bold truncate block">
                  {snippet}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
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

      {/* Add New Layer Icon Button */}
      <button
        type="button"
        onClick={onAddTextLayer}
        className="w-full py-2 px-3 rounded-xl border-2 border-dashed border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-bold"
        title="Add New Text Layer"
        aria-label="Add New Text Layer"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};
