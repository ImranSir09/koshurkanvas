import React, { useState, useRef, useEffect } from 'react';
import { TextStyleProperties, TextLayer } from '../types';
import { getFontFamilyCSS, SYSTEM_FONTS } from '../lib/fontUtils';
import { addCustomFont, getCustomFonts, deleteCustomFont, onCustomFontsChange, CustomFontItem } from '../lib/customFonts';
import { LayerAlignmentType } from '../lib/layerUtils';
import { ColorGradientPicker } from './ColorGradientPicker';
import {
  Edit3,
  Type,
  Maximize2,
  Palette,
  Sparkles,
  Move,
  Bold,
  Italic,
  Underline,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCw,
  Plus,
  Layers,
  Settings,
  X,
  Sun,
  FoldHorizontal,
  Baseline,
  Square,
  FlipHorizontal,
  FlipVertical,
  MoveHorizontal,
  MoveVertical,
  Upload,
  Pilcrow,
  ArrowRightToLine,
  ArrowLeftToLine,
  Magnet,
  Image as ImageIcon,
  Crop as CropIcon,
  Navigation,
  Lock,
  Unlock,
  RefreshCw,
  Circle,
  RectangleHorizontal,
} from 'lucide-react';

interface MobileTextDesignToolbarProps {
  activeLayer: TextLayer | null;
  layersCount?: number;
  currentStyle: TextStyleProperties;
  onUpdateStyle: (updates: Partial<TextStyleProperties>) => void;
  onUpdateLayerObject?: (layerId: string, updates: Partial<TextLayer>) => void;
  onOpenUnicodeEditor: () => void;
  onAddNewText: () => void;
  onOpenImageModal?: (isReplacing?: boolean) => void;
  onDuplicateLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onBringToFront: (layerId: string) => void;
  onSendToBack: (layerId: string) => void;
  onMoveUp?: (layerId: string) => void;
  onMoveDown?: (layerId: string) => void;
  onOpenLayersPanel?: () => void;
  isLayersPanelOpen?: boolean;
  onOpenCanvasSettings?: () => void;
  isCanvasSettingsOpen?: boolean;
  onCenterHorizontally?: (layerId: string) => void;
  onCenterVertically?: (layerId: string) => void;
  onAlignLayers?: (layerIds: string[], alignment: LayerAlignmentType) => void;
  onNudgeLayer?: (dx: number, dy: number) => void;
  selectedLayerIds?: string[];
  snapEnabled?: boolean;
  onToggleSnap?: (enabled: boolean) => void;
  snapSensitivity?: number;
  onChangeSnapSensitivity?: (sensitivity: number) => void;
}

type ActiveSheet =
  | 'none'
  | 'font'
  | 'size'
  | 'format'
  | 'color'
  | 'effects'
  | 'border'
  | 'transform'
  | 'align'
  | 'snap'
  | 'nudge'
  | 'crop'
  | 'opacity'
  | 'rotate';

const FONTS = SYSTEM_FONTS;

const SHADOW_COLORS = [
  'rgba(0,0,0,0.5)',
  'rgba(0,0,0,0.85)',
  'rgba(4,120,87,0.5)',
  'rgba(217,119,6,0.5)',
  'rgba(185,28,28,0.5)',
  'rgba(56,189,248,0.75)',
  'rgba(255,255,255,0.8)',
];

export const MobileTextDesignToolbar: React.FC<MobileTextDesignToolbarProps> = ({
  activeLayer,
  layersCount = 0,
  currentStyle,
  onUpdateStyle,
  onUpdateLayerObject,
  onOpenUnicodeEditor,
  onAddNewText,
  onOpenImageModal,
  onDuplicateLayer,
  onDeleteLayer,
  onBringToFront,
  onSendToBack,
  onMoveUp,
  onMoveDown,
  onOpenLayersPanel,
  isLayersPanelOpen = false,
  onOpenCanvasSettings,
  isCanvasSettingsOpen = false,
  onCenterHorizontally,
  onCenterVertically,
  onAlignLayers,
  onNudgeLayer,
  selectedLayerIds = [],
  snapEnabled = true,
  onToggleSnap,
  snapSensitivity = 8,
  onChangeSnapSensitivity,
}) => {
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>('none');
  const [customFontsList, setCustomFontsList] = useState<CustomFontItem[]>(() => getCustomFonts());
  const [nudgeStep, setNudgeStep] = useState<number>(5);
  const fontFileInputRef = useRef<HTMLInputElement | null>(null);

  // Close sheet if active layer is deselected (unless inspecting global snap)
  useEffect(() => {
    if (!activeLayer && activeSheet !== 'snap' && activeSheet !== 'none') {
      setActiveSheet('none');
    }
  }, [activeLayer, activeSheet]);

  // Keep custom fonts in sync
  useEffect(() => {
    setCustomFontsList(getCustomFonts());
    const unsub = onCustomFontsChange(() => {
      setCustomFontsList(getCustomFonts());
    });
    return () => unsub();
  }, []);

  const toggleSheet = (sheet: ActiveSheet) => {
    setActiveSheet((prev) => (prev === sheet ? 'none' : sheet));
  };

  const isImageLayer = activeLayer?.type === 'image';

  // Layer Property Updaters (dispatches to either onUpdateLayerObject or onUpdateStyle)
  const updateActiveLayerProp = (updates: Partial<TextLayer>) => {
    if (!activeLayer) return;
    if (onUpdateLayerObject) {
      onUpdateLayerObject(activeLayer.id, updates);
    }
  };

  const handleCustomFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const font = await addCustomFont(file);
      onUpdateStyle({ fontFamily: font.name });
      setCustomFontsList(getCustomFonts());
    } catch (err: any) {
      alert(err.message || 'Failed to upload custom font.');
    } finally {
      if (fontFileInputRef.current) {
        fontFileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteCustomFont = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteCustomFont(id);
    setCustomFontsList(getCustomFonts());
  };

  const handleNudge = (dx: number, dy: number) => {
    if (onNudgeLayer) {
      onNudgeLayer(dx * nudgeStep, dy * nudgeStep);
    } else if (activeLayer && onUpdateLayerObject) {
      onUpdateLayerObject(activeLayer.id, {
        x: Math.round(activeLayer.x + dx * nudgeStep),
        y: Math.round(activeLayer.y + dy * nudgeStep),
      });
    }
  };

  const handleScalePreset = (factor: number) => {
    if (!activeLayer || !onUpdateLayerObject) return;
    const curW = activeLayer.width || 240;
    const curH = activeLayer.height || 180;
    const origW = activeLayer.originalWidth || curW;
    const origH = activeLayer.originalHeight || curH;
    const newW = Math.round(origW * factor);
    const newH = Math.round(origH * factor);
    onUpdateLayerObject(activeLayer.id, {
      width: newW,
      height: newH,
    });
  };

  return (
    <div
      id="mobile-text-design-toolbar-container"
      className="w-full bg-white border-t-2 border-stone-300 shadow-xl z-30 flex flex-col shrink-0"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.25rem)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 0rem)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 0rem)',
      }}
      dir="ltr"
    >
      {/* 1. EXPANDABLE BOTTOM DRAWER PANELS */}
      {activeSheet !== 'none' && (activeLayer || activeSheet === 'snap') && (
        <div className="w-full bg-stone-50 border-b-2 border-stone-300 p-2.5 sm:p-3.5 max-h-[260px] sm:max-h-[300px] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-300">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
              {activeSheet === 'font' && <Type size={16} className="text-emerald-800" />}
              {activeSheet === 'size' && <Maximize2 size={16} className="text-emerald-800" />}
              {activeSheet === 'format' && <Pilcrow size={16} className="text-emerald-800" />}
              {activeSheet === 'color' && <Palette size={16} className="text-emerald-800" />}
              {activeSheet === 'border' && <Square size={16} className="text-emerald-800" />}
              {activeSheet === 'effects' && <Sparkles size={16} className="text-emerald-800" />}
              {activeSheet === 'transform' && <Move size={16} className="text-emerald-800" />}
              {activeSheet === 'nudge' && <Navigation size={16} className="text-emerald-800" />}
              {activeSheet === 'crop' && <CropIcon size={16} className="text-emerald-800" />}
              {activeSheet === 'opacity' && <Sun size={16} className="text-emerald-800" />}
              {activeSheet === 'rotate' && <RotateCw size={16} className="text-emerald-800" />}
              {activeSheet === 'align' && <AlignLeft size={16} className="text-emerald-800" />}
              {activeSheet === 'snap' && <Magnet size={16} className="text-emerald-800" />}
              <span className="capitalize font-sans font-bold">
                {activeSheet === 'font' && 'Font Family'}
                {activeSheet === 'size' && (isImageLayer ? 'Image Dimensions & Scale' : 'Text Size & Spacing')}
                {activeSheet === 'format' && 'Format & Typography Style'}
                {activeSheet === 'color' && 'Color & Highlight'}
                {activeSheet === 'border' && (isImageLayer ? 'Border & Frame' : 'Corner Radius & Border')}
                {activeSheet === 'effects' && (isImageLayer ? 'Image Filters & Shadow' : 'Shadow & Text Stroke')}
                {activeSheet === 'transform' && 'Position, Flip & Reorder'}
                {activeSheet === 'nudge' && 'Precision Nudge (D-Pad)'}
                {activeSheet === 'crop' && 'Crop & Aspect Ratio'}
                {activeSheet === 'opacity' && 'Layer Opacity'}
                {activeSheet === 'rotate' && 'Rotation & Angle'}
                {activeSheet === 'align' && 'Align to Selection Bounds'}
                {activeSheet === 'snap' && 'Smart Snapping & Dynamic Guides'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveSheet('none')}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-800 hover:text-black bg-white hover:bg-stone-200 border border-stone-300 transition-colors cursor-pointer"
              aria-label="Close panel"
            >
              <X size={16} />
            </button>
          </div>

          {/* FONT SHEET */}
          {activeSheet === 'font' && (
            <div className="flex flex-col gap-2.5">
              <input
                ref={fontFileInputRef}
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleCustomFontUpload}
                className="hidden"
              />

              {/* Upload Custom Font Action Card */}
              <button
                type="button"
                onClick={() => fontFileInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-emerald-600 bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
              >
                <Upload size={16} className="text-emerald-700 shrink-0" />
                <span className="font-sans text-xs">Upload Custom Font (.TTF, .OTF, .WOFF)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* Custom Uploaded Fonts */}
                {customFontsList.map((cf) => (
                  <div
                    key={cf.id}
                    onClick={() => onUpdateStyle({ fontFamily: cf.name })}
                    className={`relative p-2.5 rounded-xl text-center border-2 transition-all flex flex-col items-center justify-center cursor-pointer ${
                      currentStyle.fontFamily === cf.name
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCustomFont(e, cf.id)}
                      className="absolute top-1 right-1 p-1 text-stone-400 hover:text-red-600 rounded-md transition-colors"
                      title="Delete font"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div
                      className="text-base leading-tight truncate max-w-full"
                      style={{ fontFamily: `'${cf.name}', serif` }}
                      dir="rtl"
                    >
                      کٲشُر
                    </div>
                    <div
                      className={`text-[10px] font-sans mt-1 truncate max-w-[90%] ${
                        currentStyle.fontFamily === cf.name ? 'text-emerald-100' : 'text-stone-600'
                      }`}
                    >
                      {cf.name}
                    </div>
                  </div>
                ))}

                {/* Built-in Fonts */}
                {FONTS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onUpdateStyle({ fontFamily: f.id })}
                    className={`p-2.5 rounded-xl text-center border-2 transition-all flex flex-col items-center justify-center cursor-pointer ${
                      currentStyle.fontFamily === f.id
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <div
                      className="text-base leading-tight truncate max-w-full"
                      style={{ fontFamily: getFontFamilyCSS(f.id) }}
                      dir="rtl"
                    >
                      {f.preview}
                    </div>
                    <div className={`text-[10px] font-sans mt-1 ${currentStyle.fontFamily === f.id ? 'text-emerald-100' : 'text-stone-600'}`}>
                      {f.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SIZE & SPACING / DIMENSIONS SHEET */}
          {activeSheet === 'size' && (
            <div className="flex flex-col gap-3">
              {isImageLayer ? (
                /* IMAGE DIMENSIONS & SCALE CONTROLS */
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                        <span>Width (px)</span>
                        <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {activeLayer.width || 240}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="40"
                        max="800"
                        step="5"
                        value={activeLayer.width || 240}
                        onChange={(e) => {
                          const newW = parseInt(e.target.value, 10);
                          const lock = activeLayer.lockAspectRatio !== false;
                          const aspect = activeLayer.aspectRatio || ((activeLayer.width || 240) / Math.max(1, activeLayer.height || 180));
                          updateActiveLayerProp({
                            width: newW,
                            height: lock ? Math.max(30, Math.round(newW / aspect)) : activeLayer.height,
                          });
                        }}
                        className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                        <span>Height (px)</span>
                        <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {activeLayer.height || 180}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="40"
                        max="800"
                        step="5"
                        value={activeLayer.height || 180}
                        onChange={(e) => {
                          const newH = parseInt(e.target.value, 10);
                          const lock = activeLayer.lockAspectRatio !== false;
                          const aspect = activeLayer.aspectRatio || ((activeLayer.width || 240) / Math.max(1, activeLayer.height || 180));
                          updateActiveLayerProp({
                            height: newH,
                            width: lock ? Math.max(40, Math.round(newH * aspect)) : activeLayer.width,
                          });
                        }}
                        className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Lock Aspect Ratio Toggle */}
                  <div className="p-2.5 bg-white rounded-xl border border-stone-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {activeLayer.lockAspectRatio !== false ? (
                        <Lock size={15} className="text-emerald-700" />
                      ) : (
                        <Unlock size={15} className="text-stone-500" />
                      )}
                      <span className="text-xs font-sans font-bold text-stone-900">Lock Aspect Ratio</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateActiveLayerProp({ lockAspectRatio: activeLayer.lockAspectRatio === false ? true : false })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer ${
                        activeLayer.lockAspectRatio !== false
                          ? 'bg-emerald-700 text-white'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {activeLayer.lockAspectRatio !== false ? 'Locked' : 'Freeform'}
                    </button>
                  </div>

                  {/* Quick Scale Presets */}
                  <div>
                    <div className="text-[11px] font-bold text-stone-700 font-sans uppercase tracking-wider mb-1.5">
                      Scale Presets (Natural Size)
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[0.5, 0.75, 1.0, 1.25, 1.5].map((factor) => (
                        <button
                          key={factor}
                          type="button"
                          onClick={() => handleScalePreset(factor)}
                          className="py-1.5 px-2 bg-white hover:bg-emerald-50 hover:border-emerald-600 border border-stone-300 rounded-xl text-xs font-bold font-sans text-stone-800 transition-all cursor-pointer active:scale-95 shadow-2xs"
                        >
                          {Math.round(factor * 100)}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* TEXT SIZE & SPACING CONTROLS */
                <>
                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                      <span className="flex items-center gap-1.5">
                        <Maximize2 size={14} className="text-emerald-800" />
                        <span>Font Size</span>
                      </span>
                      <span className="font-mono font-bold text-stone-950 bg-white px-2 py-0.5 rounded-lg border border-stone-300 text-xs">
                        {currentStyle.fontSize || 24}px
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateStyle({ fontSize: Math.max(8, (currentStyle.fontSize || 24) - 2) })}
                        className="w-9 h-9 rounded-xl bg-white border-2 border-stone-300 font-bold text-stone-900 hover:bg-stone-200 flex items-center justify-center text-sm cursor-pointer shadow-xs active:scale-95"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="8"
                        max="100"
                        step="1"
                        value={Math.max(8, Math.min(100, currentStyle.fontSize || 24))}
                        onChange={(e) => onUpdateStyle({ fontSize: parseInt(e.target.value, 10) })}
                        className="flex-1 accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdateStyle({ fontSize: Math.min(100, (currentStyle.fontSize || 24) + 2) })}
                        className="w-9 h-9 rounded-xl bg-white border-2 border-stone-300 font-bold text-stone-900 hover:bg-stone-200 flex items-center justify-center text-sm cursor-pointer shadow-xs active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Line Height & Letter Spacing */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-300">
                    <div>
                      <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                        <span className="flex items-center gap-1">
                          <Baseline size={13} className="text-emerald-800" />
                          <span>Line Spacing</span>
                        </span>
                        <span className="font-mono font-bold text-stone-950">
                          {currentStyle.lineHeight || 2.2}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="3.5"
                        step="0.1"
                        value={currentStyle.lineHeight || 2.2}
                        onChange={(e) => onUpdateStyle({ lineHeight: parseFloat(e.target.value) })}
                        className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                        <span className="flex items-center gap-1">
                          <FoldHorizontal size={13} className="text-emerald-800" />
                          <span>Letter Space</span>
                        </span>
                        <span className="font-mono font-bold text-stone-950">
                          {currentStyle.letterSpacing || 0}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-2"
                        max="10"
                        step="0.5"
                        value={currentStyle.letterSpacing || 0}
                        onChange={(e) => onUpdateStyle({ letterSpacing: parseFloat(e.target.value) })}
                        className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* CROP & SHAPE PRESETS SHEET (FOR IMAGE OBJECTS) */}
          {activeSheet === 'crop' && isImageLayer && (
            <div className="flex flex-col gap-3">
              <div className="text-[11px] font-bold text-stone-700 font-sans uppercase tracking-wider">
                Crop & Mask Aspect Ratio
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { id: 'original', label: 'Original', icon: ImageIcon },
                  { id: '1:1', label: '1:1 Square', icon: Square },
                  { id: '4:3', label: '4:3 Ratio', icon: RectangleHorizontal },
                  { id: '16:9', label: '16:9 Wide', icon: RectangleHorizontal },
                  { id: 'circle', label: 'Circle Mask', icon: Circle },
                ].map((preset) => {
                  const Icon = preset.icon;
                  const isActive = (activeLayer.cropPreset || 'original') === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => updateActiveLayerProp({ cropPreset: preset.id as any })}
                      className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                          : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-[10px] font-sans font-bold">{preset.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Corner Radius */}
              <div className="pt-2 border-t border-stone-300">
                <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                  <span>Corner Radius</span>
                  <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {activeLayer.borderRadius || 0}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="2"
                  value={activeLayer.borderRadius || 0}
                  onChange={(e) => updateActiveLayerProp({ borderRadius: parseInt(e.target.value, 10) })}
                  className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* DEDICATED NUDGE D-PAD SHEET */}
          {activeSheet === 'nudge' && activeLayer && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-stone-800 font-sans">
                  Step Size:
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 5, 10, 25].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setNudgeStep(step)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        nudgeStep === step
                          ? 'bg-emerald-700 text-white border border-emerald-800'
                          : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      {step}px
                    </button>
                  ))}
                </div>
              </div>

              {/* D-Pad Controller */}
              <div className="flex items-center justify-center py-2">
                <div className="relative w-36 h-36 bg-stone-200/80 rounded-2xl border-2 border-stone-300 p-1 flex items-center justify-center shadow-inner">
                  {/* Up */}
                  <button
                    type="button"
                    onClick={() => handleNudge(0, -1)}
                    className="absolute top-1.5 left-1/2 -translate-x-1/2 w-11 h-10 rounded-xl bg-white border border-stone-300 text-stone-800 hover:bg-emerald-50 hover:border-emerald-600 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-xs"
                    title="Nudge Up"
                    aria-label="Nudge Up"
                  >
                    <ArrowUp size={18} />
                  </button>

                  {/* Down */}
                  <button
                    type="button"
                    onClick={() => handleNudge(0, 1)}
                    className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-11 h-10 rounded-xl bg-white border border-stone-300 text-stone-800 hover:bg-emerald-50 hover:border-emerald-600 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-xs"
                    title="Nudge Down"
                    aria-label="Nudge Down"
                  >
                    <ArrowDown size={18} />
                  </button>

                  {/* Left */}
                  <button
                    type="button"
                    onClick={() => handleNudge(-1, 0)}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 w-10 h-11 rounded-xl bg-white border border-stone-300 text-stone-800 hover:bg-emerald-50 hover:border-emerald-600 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-xs"
                    title="Nudge Left"
                    aria-label="Nudge Left"
                  >
                    <AlignLeft size={18} />
                  </button>

                  {/* Right */}
                  <button
                    type="button"
                    onClick={() => handleNudge(1, 0)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-11 rounded-xl bg-white border border-stone-300 text-stone-800 hover:bg-emerald-50 hover:border-emerald-600 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-xs"
                    title="Nudge Right"
                    aria-label="Nudge Right"
                  >
                    <AlignRight size={18} />
                  </button>

                  {/* Center coordinates */}
                  <div className="text-[10px] font-mono text-stone-600 font-bold text-center leading-tight">
                    <div>X:{activeLayer.x}</div>
                    <div>Y:{activeLayer.y}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DEDICATED ROTATION SHEET */}
          {activeSheet === 'rotate' && activeLayer && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                <span>Rotation Angle</span>
                <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {activeLayer.rotation || 0}°
                </span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={activeLayer.rotation || 0}
                onChange={(e) => updateActiveLayerProp({ rotation: parseInt(e.target.value, 10) })}
                className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
              />

              {/* Quick Rotation Buttons */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-stone-300">
                <button
                  type="button"
                  onClick={() => updateActiveLayerProp({ rotation: 0 })}
                  className="py-2 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl text-xs font-bold font-sans text-stone-800 cursor-pointer shadow-2xs"
                >
                  0° Reset
                </button>
                <button
                  type="button"
                  onClick={() => updateActiveLayerProp({ rotation: ((activeLayer.rotation || 0) + 90) % 360 })}
                  className="py-2 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl text-xs font-bold font-sans text-stone-800 cursor-pointer shadow-2xs"
                >
                  +90°
                </button>
                <button
                  type="button"
                  onClick={() => updateActiveLayerProp({ rotation: 180 })}
                  className="py-2 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl text-xs font-bold font-sans text-stone-800 cursor-pointer shadow-2xs"
                >
                  180°
                </button>
                <button
                  type="button"
                  onClick={() => updateActiveLayerProp({ rotation: 270 })}
                  className="py-2 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl text-xs font-bold font-sans text-stone-800 cursor-pointer shadow-2xs"
                >
                  270°
                </button>
              </div>
            </div>
          )}

          {/* DEDICATED OPACITY SHEET */}
          {activeSheet === 'opacity' && activeLayer && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                <span>Layer Opacity</span>
                <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {Math.round((activeLayer.opacity ?? 1) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={activeLayer.opacity ?? 1}
                onChange={(e) => updateActiveLayerProp({ opacity: parseFloat(e.target.value) })}
                className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
              />

              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-stone-300">
                {[0.25, 0.5, 0.75, 1.0].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateActiveLayerProp({ opacity: val })}
                    className="py-2 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl text-xs font-bold font-sans text-stone-800 cursor-pointer shadow-2xs"
                  >
                    {Math.round(val * 100)}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FORMAT & TYPOGRAPHY STYLE SHEET */}
          {activeSheet === 'format' && (
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-[11px] font-bold text-stone-700 font-sans uppercase tracking-wider mb-1">
                  Text Style & Direction
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateStyle({ bold: !currentStyle.bold })}
                    className={`flex-1 h-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                      currentStyle.bold
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-200'
                    }`}
                    title="Bold"
                  >
                    <Bold size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateStyle({ italic: !currentStyle.italic })}
                    className={`flex-1 h-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                      currentStyle.italic
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-200'
                    }`}
                    title="Italic"
                  >
                    <Italic size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateStyle({ underline: !currentStyle.underline })}
                    className={`flex-1 h-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                      currentStyle.underline
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-200'
                    }`}
                    title="Underline"
                  >
                    <Underline size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateStyle({
                        direction: currentStyle.direction === 'rtl' ? 'ltr' : 'rtl',
                      })
                    }
                    className={`flex-1 h-9 rounded-xl border-2 flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      currentStyle.direction === 'rtl'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-200'
                    }`}
                    title="Direction RTL / LTR"
                  >
                    {currentStyle.direction === 'rtl' ? (
                      <ArrowRightToLine size={16} />
                    ) : (
                      <ArrowLeftToLine size={16} />
                    )}
                    <span className="text-[10px] font-sans font-bold">
                      {currentStyle.direction === 'rtl' ? 'RTL' : 'LTR'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Text Alignment */}
              <div className="pt-2 border-t border-stone-300">
                <div className="text-[11px] font-bold text-stone-700 font-sans uppercase tracking-wider mb-1">
                  Text Alignment
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateStyle({ align: 'right' })}
                    className={`flex-1 h-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                      (currentStyle.align || 'center') === 'right'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-200'
                    }`}
                    title="Align Right"
                  >
                    <AlignRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateStyle({ align: 'center' })}
                    className={`flex-1 h-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                      (currentStyle.align || 'center') === 'center'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-200'
                    }`}
                    title="Align Center"
                  >
                    <AlignCenter size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateStyle({ align: 'left' })}
                    className={`flex-1 h-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                      (currentStyle.align || 'center') === 'left'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-200'
                    }`}
                    title="Align Left"
                  >
                    <AlignLeft size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateStyle({ align: 'justify' })}
                    className={`flex-1 h-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                      (currentStyle.align || 'center') === 'justify'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-200'
                    }`}
                    title="Justify"
                  >
                    <AlignJustify size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* COLOR & HIGHLIGHT SHEET */}
          {activeSheet === 'color' && (
            <div className="flex flex-col gap-3">
              <ColorGradientPicker
                label="Text Color / Gradient"
                value={typeof currentStyle.color === 'string' ? currentStyle.color : (currentStyle.color as any)?.color || '#1c1917'}
                gradientValue={typeof currentStyle.gradient === 'string' ? currentStyle.gradient : (currentStyle.gradient as any)?.gradient}
                onChange={(res) => {
                  if (typeof res === 'object' && res !== null && 'type' in res) {
                    if (res.type === 'gradient') {
                      onUpdateStyle({ gradient: res.gradient, color: undefined });
                    } else {
                      onUpdateStyle({ color: res.color || '#1c1917', gradient: undefined });
                    }
                  } else {
                    onUpdateStyle({ color: (res as any) || '#1c1917', gradient: undefined });
                  }
                }}
              />

              <div className="pt-2 border-t border-stone-300">
                <ColorGradientPicker
                  label="Highlight Background"
                  allowNone={true}
                  noneLabel="None"
                  value={typeof currentStyle.highlightColor === 'string' ? currentStyle.highlightColor : (currentStyle.highlightColor as any)?.color || 'transparent'}
                  gradientValue={typeof currentStyle.highlightGradient === 'string' ? currentStyle.highlightGradient : (currentStyle.highlightGradient as any)?.gradient}
                  onChange={(res) => {
                    if (typeof res === 'object' && res !== null && 'type' in res) {
                      if (res.type === 'none') {
                        onUpdateStyle({ highlightColor: undefined, highlightGradient: undefined });
                      } else if (res.type === 'gradient') {
                        onUpdateStyle({ highlightGradient: res.gradient, highlightColor: undefined });
                      } else {
                        onUpdateStyle({ highlightColor: res.color, highlightGradient: undefined });
                      }
                    } else {
                      onUpdateStyle({ highlightColor: (res as any), highlightGradient: undefined });
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* BORDER & CORNER RADIUS SHEET */}
          {activeSheet === 'border' && (
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                  <span>Border Width</span>
                  <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {isImageLayer ? (activeLayer.borderWidth || 0) : (currentStyle.borderWidth || 0)}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={isImageLayer ? (activeLayer.borderWidth || 0) : (currentStyle.borderWidth || 0)}
                  onChange={(e) => {
                    const bw = parseInt(e.target.value, 10);
                    if (isImageLayer) {
                      updateActiveLayerProp({ borderWidth: bw });
                    } else {
                      onUpdateStyle({ borderWidth: bw });
                    }
                  }}
                  className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                  <span>Border Color</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {['#000000', '#ffffff', '#047857', '#d97706', '#b91c1c', '#1d4ed8', '#475569'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => {
                        if (isImageLayer) {
                          updateActiveLayerProp({ borderColor: col });
                        } else {
                          onUpdateStyle({ borderColor: col });
                        }
                      }}
                      className="w-7 h-7 rounded-full border-2 border-stone-300 shadow-2xs shrink-0 cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                  <span>Corner Radius</span>
                  <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {isImageLayer ? (activeLayer.borderRadius || 0) : (currentStyle.borderRadius || 0)}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="2"
                  value={isImageLayer ? (activeLayer.borderRadius || 0) : (currentStyle.borderRadius || 0)}
                  onChange={(e) => {
                    const br = parseInt(e.target.value, 10);
                    if (isImageLayer) {
                      updateActiveLayerProp({ borderRadius: br });
                    } else {
                      onUpdateStyle({ borderRadius: br });
                    }
                  }}
                  className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* EFFECTS & FILTERS SHEET */}
          {activeSheet === 'effects' && (
            <div className="flex flex-col gap-3">
              {isImageLayer ? (
                /* IMAGE FILTERS & SHADOW */
                <div className="flex flex-col gap-3">
                  {/* Drop Shadow Toggle */}
                  <div className="p-2.5 bg-white rounded-xl border border-stone-300 flex items-center justify-between">
                    <span className="text-xs font-sans font-bold text-stone-900">Image Drop Shadow</span>
                    <button
                      type="button"
                      onClick={() => updateActiveLayerProp({ shadow: !activeLayer.shadow })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer ${
                        activeLayer.shadow
                          ? 'bg-emerald-700 text-white'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {activeLayer.shadow ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  {/* Brightness */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                      <span>Brightness</span>
                      <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {Math.round((activeLayer.brightness ?? 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2"
                      step="0.05"
                      value={activeLayer.brightness ?? 1}
                      onChange={(e) => updateActiveLayerProp({ brightness: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                    />
                  </div>

                  {/* Contrast */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                      <span>Contrast</span>
                      <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {Math.round((activeLayer.contrast ?? 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2"
                      step="0.05"
                      value={activeLayer.contrast ?? 1}
                      onChange={(e) => updateActiveLayerProp({ contrast: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                    />
                  </div>

                  {/* Grayscale */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                      <span>Grayscale</span>
                      <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {activeLayer.grayscale || 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={activeLayer.grayscale || 0}
                      onChange={(e) => updateActiveLayerProp({ grayscale: parseInt(e.target.value, 10) })}
                      className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                    />
                  </div>

                  {/* Reset Filters */}
                  <button
                    type="button"
                    onClick={() => updateActiveLayerProp({ brightness: 1, contrast: 1, grayscale: 0, blur: 0, shadow: false })}
                    className="py-2 px-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-xs font-bold text-stone-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw size={14} />
                    <span>Reset Image Filters</span>
                  </button>
                </div>
              ) : (
                /* TEXT SHADOW & EFFECTS */
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                      <span>Text Shadow Blur</span>
                      <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {currentStyle.shadowBlur || 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={currentStyle.shadowBlur || 0}
                      onChange={(e) => onUpdateStyle({ shadowBlur: parseInt(e.target.value, 10) })}
                      className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-stone-700 font-sans uppercase tracking-wider mb-1">
                      Shadow Color
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                      {SHADOW_COLORS.map((sc) => (
                        <button
                          key={sc}
                          type="button"
                          onClick={() => onUpdateStyle({ shadowColor: sc })}
                          className="w-7 h-7 rounded-full border-2 border-stone-300 shadow-2xs shrink-0 cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: sc }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TRANSFORM & POSITION SHEET */}
          {activeSheet === 'transform' && activeLayer && (
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-[11px] font-bold text-stone-700 font-sans uppercase tracking-wider mb-1.5">
                  Flip & Align to Center
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = isImageLayer ? activeLayer.flipX : currentStyle.flipX;
                      if (isImageLayer) {
                        updateActiveLayerProp({ flipX: !cur });
                      } else {
                        onUpdateStyle({ flipX: !cur });
                      }
                    }}
                    className={`py-2 px-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                      (isImageLayer ? activeLayer.flipX : currentStyle.flipX)
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <FlipHorizontal size={16} />
                    <span className="text-[9.5px] font-sans font-bold">Flip H</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const cur = isImageLayer ? activeLayer.flipY : currentStyle.flipY;
                      if (isImageLayer) {
                        updateActiveLayerProp({ flipY: !cur });
                      } else {
                        onUpdateStyle({ flipY: !cur });
                      }
                    }}
                    className={`py-2 px-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                      (isImageLayer ? activeLayer.flipY : currentStyle.flipY)
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <FlipVertical size={16} />
                    <span className="text-[9.5px] font-sans font-bold">Flip V</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCenterHorizontally && onCenterHorizontally(activeLayer.id)}
                    className="py-2 px-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs active:scale-95"
                  >
                    <AlignCenter size={16} />
                    <span className="text-[9.5px] font-sans font-bold">Center X</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCenterVertically && onCenterVertically(activeLayer.id)}
                    className="py-2 px-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs active:scale-95"
                  >
                    <MoveVertical size={16} />
                    <span className="text-[9.5px] font-sans font-bold">Center Y</span>
                  </button>
                </div>
              </div>

              {/* Layer Stacking Order */}
              <div className="pt-2 border-t border-stone-300">
                <div className="text-[11px] font-bold text-stone-700 font-sans uppercase tracking-wider mb-1.5">
                  Stacking Order (Z-Index)
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => onBringToFront(activeLayer.id)}
                    className="py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-[10px] font-bold font-sans flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <ArrowUp size={14} />
                    <span>To Front</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSendToBack(activeLayer.id)}
                    className="py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-[10px] font-bold font-sans flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <ArrowDown size={14} />
                    <span>To Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveUp && onMoveUp(activeLayer.id)}
                    className="py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-[10px] font-bold font-sans flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <span>Forward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveDown && onMoveDown(activeLayer.id)}
                    className="py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-[10px] font-bold font-sans flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <span>Backward</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ALIGN SHEET */}
          {activeSheet === 'align' && (
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-[11px] font-bold text-stone-700 font-sans uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Align to Selection Bounds (6 Edges)</span>
                  {selectedLayerIds && selectedLayerIds.length > 1 && (
                    <span className="text-[10px] font-sans font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {selectedLayerIds.length} Layers Selected
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onAlignLayers && activeLayer) {
                        onAlignLayers(
                          selectedLayerIds && selectedLayerIds.length > 0
                            ? selectedLayerIds
                            : [activeLayer.id],
                          'left'
                        );
                      }
                    }}
                    className="p-2.5 rounded-xl border-2 border-stone-300 bg-white hover:border-emerald-600 hover:bg-emerald-50 text-stone-900 flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs transition-all"
                    title="Align Left Edges"
                  >
                    <AlignLeft size={18} />
                    <span className="text-[10px] font-sans font-semibold">Left</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onAlignLayers && activeLayer) {
                        onAlignLayers(
                          selectedLayerIds && selectedLayerIds.length > 0
                            ? selectedLayerIds
                            : [activeLayer.id],
                          'center'
                        );
                      }
                    }}
                    className="p-2.5 rounded-xl border-2 border-stone-300 bg-white hover:border-emerald-600 hover:bg-emerald-50 text-stone-900 flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs transition-all"
                    title="Align Center Horizontal"
                  >
                    <AlignCenter size={18} />
                    <span className="text-[10px] font-sans font-semibold">Center X</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onAlignLayers && activeLayer) {
                        onAlignLayers(
                          selectedLayerIds && selectedLayerIds.length > 0
                            ? selectedLayerIds
                            : [activeLayer.id],
                          'right'
                        );
                      }
                    }}
                    className="p-2.5 rounded-xl border-2 border-stone-300 bg-white hover:border-emerald-600 hover:bg-emerald-50 text-stone-900 flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs transition-all"
                    title="Align Right Edges"
                  >
                    <AlignRight size={18} />
                    <span className="text-[10px] font-sans font-semibold">Right</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onAlignLayers && activeLayer) {
                        onAlignLayers(
                          selectedLayerIds && selectedLayerIds.length > 0
                            ? selectedLayerIds
                            : [activeLayer.id],
                          'top'
                        );
                      }
                    }}
                    className="p-2.5 rounded-xl border-2 border-stone-300 bg-white hover:border-emerald-600 hover:bg-emerald-50 text-stone-900 flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs transition-all"
                    title="Align Top Edges"
                  >
                    <ArrowUp size={18} />
                    <span className="text-[10px] font-sans font-semibold">Top</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onAlignLayers && activeLayer) {
                        onAlignLayers(
                          selectedLayerIds && selectedLayerIds.length > 0
                            ? selectedLayerIds
                            : [activeLayer.id],
                          'middle'
                        );
                      }
                    }}
                    className="p-2.5 rounded-xl border-2 border-stone-300 bg-white hover:border-emerald-600 hover:bg-emerald-50 text-stone-900 flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs transition-all"
                    title="Align Middle Vertical"
                  >
                    <MoveVertical size={18} />
                    <span className="text-[10px] font-sans font-semibold">Middle Y</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onAlignLayers && activeLayer) {
                        onAlignLayers(
                          selectedLayerIds && selectedLayerIds.length > 0
                            ? selectedLayerIds
                            : [activeLayer.id],
                          'bottom'
                        );
                      }
                    }}
                    className="p-2.5 rounded-xl border-2 border-stone-300 bg-white hover:border-emerald-600 hover:bg-emerald-50 text-stone-900 flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs transition-all"
                    title="Align Bottom Edges"
                  >
                    <ArrowDown size={18} />
                    <span className="text-[10px] font-sans font-semibold">Bottom</span>
                  </button>
                </div>
              </div>

              {/* Distribution Actions */}
              <div className="pt-2 border-t border-stone-300">
                <div className="text-[11px] font-bold text-stone-700 font-sans uppercase tracking-wider mb-2">
                  Distribute Spacing
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onAlignLayers && activeLayer) {
                        onAlignLayers(
                          selectedLayerIds && selectedLayerIds.length > 0
                            ? selectedLayerIds
                            : [activeLayer.id],
                          'distribute-h'
                        );
                      }
                    }}
                    className="h-10 rounded-xl border-2 border-stone-300 bg-white hover:border-emerald-600 hover:bg-emerald-50 text-stone-900 flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-xs transition-all"
                    title="Distribute Horizontally"
                  >
                    <MoveHorizontal size={16} />
                    <span className="text-xs font-sans font-bold">Distribute Horizontally</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onAlignLayers && activeLayer) {
                        onAlignLayers(
                          selectedLayerIds && selectedLayerIds.length > 0
                            ? selectedLayerIds
                            : [activeLayer.id],
                          'distribute-v'
                        );
                      }
                    }}
                    className="h-10 rounded-xl border-2 border-stone-300 bg-white hover:border-emerald-600 hover:bg-emerald-50 text-stone-900 flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-xs transition-all"
                    title="Distribute Vertically"
                  >
                    <MoveVertical size={16} />
                    <span className="text-xs font-sans font-bold">Distribute Vertically</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SMART SNAPPING SHEET */}
          {activeSheet === 'snap' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-white rounded-xl border-2 border-stone-300 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      snapEnabled ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    <Magnet size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-sans font-bold text-stone-900">
                      Smart Snapping & Dynamic Guides
                    </h4>
                    <p className="text-[10px] font-sans text-stone-500">
                      Auto-align to canvas center, edges & other layers
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleSnap && onToggleSnap(!snapEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    snapEnabled ? 'bg-emerald-700' : 'bg-stone-300'
                  }`}
                  aria-label="Toggle Smart Snapping"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      snapEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Snap Sensitivity Slider */}
              <div className="p-3 bg-white rounded-xl border-2 border-stone-300 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-bold text-stone-800">Snapping Sensitivity</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                    {snapSensitivity ?? 8} px
                  </span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={20}
                  step={2}
                  value={snapSensitivity ?? 8}
                  onChange={(e) =>
                    onChangeSnapSensitivity && onChangeSnapSensitivity(Number(e.target.value))
                  }
                  disabled={!snapEnabled}
                  className="w-full accent-emerald-700 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PRIMARY BOTTOM TOOLBAR (ZERO DUPLICATION, ULTRA SLEEK) */}
      <div className="w-full px-1.5 sm:px-3 py-1 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        {activeLayer ? (
          /* CONTEXTUAL TOOLBAR WHEN A LAYER IS SELECTED */
          <div className="w-full flex items-center justify-between gap-1 min-w-max">
            {/* 1. Primary Action */}
            {isImageLayer ? (
              <button
                id="btn-bottom-replace-image"
                type="button"
                onClick={() => onOpenImageModal && onOpenImageModal(true)}
                className="flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 border border-emerald-800"
                title="Replace Image"
                aria-label="Replace Image"
              >
                <RefreshCw size={15} />
                <span className="text-[9.5px] font-sans font-bold leading-none mt-0.5 whitespace-nowrap">Replace</span>
              </button>
            ) : (
              <button
                id="btn-bottom-edit-unicode"
                type="button"
                onClick={onOpenUnicodeEditor}
                className="flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 border border-emerald-800"
                title="Edit Text Content"
                aria-label="Edit Text"
              >
                <Edit3 size={15} />
                <span className="text-[9.5px] font-sans font-bold leading-none mt-0.5 whitespace-nowrap">Edit</span>
              </button>
            )}

            <div className="h-5 w-[1px] bg-stone-300 mx-0.5 shrink-0" />

            {/* 2. Image / Text Specific Tools */}
            {isImageLayer ? (
              <>
                {/* Crop / Mask */}
                <button
                  id="btn-bottom-crop"
                  type="button"
                  onClick={() => toggleSheet('crop')}
                  className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                    activeSheet === 'crop'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                  }`}
                  title="Crop & Mask"
                  aria-label="Crop"
                >
                  <CropIcon size={15} />
                  <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Crop</span>
                </button>

                {/* Dimensions / Size */}
                <button
                  id="btn-bottom-img-size"
                  type="button"
                  onClick={() => toggleSheet('size')}
                  className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                    activeSheet === 'size'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                  }`}
                  title="Dimensions & Scale"
                  aria-label="Dimensions"
                >
                  <Maximize2 size={15} />
                  <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Size</span>
                </button>

                {/* Opacity */}
                <button
                  id="btn-bottom-img-opacity"
                  type="button"
                  onClick={() => toggleSheet('opacity')}
                  className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                    activeSheet === 'opacity'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                  }`}
                  title="Layer Opacity"
                  aria-label="Opacity"
                >
                  <Sun size={15} />
                  <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Opacity</span>
                </button>

                {/* Rotate */}
                <button
                  id="btn-bottom-img-rotate"
                  type="button"
                  onClick={() => toggleSheet('rotate')}
                  className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                    activeSheet === 'rotate'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                  }`}
                  title="Rotate Image"
                  aria-label="Rotate"
                >
                  <RotateCw size={15} />
                  <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Rotate</span>
                </button>

                {/* Border */}
                <button
                  id="btn-bottom-img-border"
                  type="button"
                  onClick={() => toggleSheet('border')}
                  className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                    activeSheet === 'border'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                  }`}
                  title="Border & Frame"
                  aria-label="Border"
                >
                  <Square size={15} />
                  <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Border</span>
                </button>

                {/* Effects / Filters */}
                <button
                  id="btn-bottom-img-effects"
                  type="button"
                  onClick={() => toggleSheet('effects')}
                  className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                    activeSheet === 'effects'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                  }`}
                  title="Filters & Effects"
                  aria-label="Effects"
                >
                  <Sparkles size={15} />
                  <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Effects</span>
                </button>
              </>
            ) : (
              <>
                {/* Font */}
                <button
                  id="btn-bottom-font"
                  type="button"
                  onClick={() => toggleSheet('font')}
                  className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                    activeSheet === 'font'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                  }`}
                  title="Font Family"
                  aria-label="Font Family"
                >
                  <Type size={15} />
                  <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Font</span>
                </button>

                {/* Size */}
                <button
                  id="btn-bottom-size"
                  type="button"
                  onClick={() => toggleSheet('size')}
                  className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                    activeSheet === 'size'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                  }`}
                  title="Size & Spacing"
                  aria-label="Size"
                >
                  <Maximize2 size={15} />
                  <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Size</span>
                </button>

                {/* Color */}
                <button
                  id="btn-bottom-color"
                  type="button"
                  onClick={() => toggleSheet('color')}
                  className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                    activeSheet === 'color'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                  }`}
                  title="Color & Highlight"
                  aria-label="Color"
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-stone-400 shadow-xs shrink-0"
                    style={{
                      backgroundColor: typeof currentStyle.color === 'string'
                        ? currentStyle.color
                        : ((currentStyle.color as any)?.color || '#1c1917'),
                      backgroundImage: typeof currentStyle.gradient === 'string'
                        ? currentStyle.gradient
                        : ((currentStyle.gradient as any)?.gradient || undefined),
                    }}
                  />
                  <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Color</span>
                </button>

                {/* Format */}
                <button
                  id="btn-bottom-format"
                  type="button"
                  onClick={() => toggleSheet('format')}
                  className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                    activeSheet === 'format'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                  }`}
                  title="Format & Style"
                  aria-label="Format"
                >
                  <Pilcrow size={15} />
                  <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Format</span>
                </button>

                {/* Border */}
                <button
                  id="btn-bottom-border"
                  type="button"
                  onClick={() => toggleSheet('border')}
                  className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                    activeSheet === 'border'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                  }`}
                  title="Corner Radius & Border"
                  aria-label="Border"
                >
                  <Square size={15} />
                  <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Border</span>
                </button>

                {/* Effects */}
                <button
                  id="btn-bottom-effects"
                  type="button"
                  onClick={() => toggleSheet('effects')}
                  className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                    activeSheet === 'effects'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                  }`}
                  title="Effects & Shadow"
                  aria-label="Effects"
                >
                  <Sparkles size={15} />
                  <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Effects</span>
                </button>
              </>
            )}

            <div className="h-5 w-[1px] bg-stone-300 mx-0.5 shrink-0" />

            {/* 3. Positioning & Movement Tools */}
            {/* Position */}
            <button
              id="btn-bottom-transform"
              type="button"
              onClick={() => toggleSheet('transform')}
              className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                activeSheet === 'transform'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
              }`}
              title="Position, Flip & Reorder"
              aria-label="Position"
            >
              <Move size={15} />
              <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Position</span>
            </button>

            {/* Nudge D-Pad */}
            <button
              id="btn-bottom-nudge"
              type="button"
              onClick={() => toggleSheet('nudge')}
              className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                activeSheet === 'nudge'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
              }`}
              title="Precision Nudge D-Pad"
              aria-label="Nudge"
            >
              <Navigation size={15} />
              <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Nudge</span>
            </button>

            {/* Align */}
            <button
              id="btn-bottom-align"
              type="button"
              onClick={() => toggleSheet('align')}
              className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                activeSheet === 'align'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
              }`}
              title="Align to Selection Bounds"
              aria-label="Align"
            >
              <AlignLeft size={15} />
              <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Align</span>
            </button>

            <div className="h-5 w-[1px] bg-stone-300 mx-0.5 shrink-0" />

            {/* 4. Import & Global Management */}
            {/* Add Image Button */}
            <button
              id="btn-bottom-add-image-contextual"
              type="button"
              onClick={() => onOpenImageModal && onOpenImageModal(false)}
              className="flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 transition-all cursor-pointer shrink-0 active:scale-95"
              title="Import Image as Canvas Object"
              aria-label="Import Image"
            >
              <ImageIcon size={15} className="text-emerald-800" />
              <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">+Image</span>
            </button>

            {/* Layers */}
            <button
              id="btn-bottom-layers-contextual"
              type="button"
              onClick={onOpenLayersPanel}
              className={`relative flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl border transition-all cursor-pointer shrink-0 active:scale-95 ${
                isLayersPanelOpen
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-800'
              }`}
              title={isLayersPanelOpen ? 'Minimize Layers' : 'Layers Manager'}
              aria-label="Layers Manager"
            >
              <Layers size={15} className={isLayersPanelOpen ? 'text-white' : 'text-emerald-800'} />
              <span className="text-[9.5px] font-sans font-semibold leading-none mt-0.5 whitespace-nowrap">Layers</span>
              {layersCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 w-3.5 h-3.5 text-[8.5px] font-bold rounded-full flex items-center justify-center shadow-xs ${
                    isLayersPanelOpen ? 'bg-white text-emerald-800' : 'bg-emerald-700 text-white'
                  }`}
                >
                  {layersCount}
                </span>
              )}
            </button>

            {/* Canvas Settings */}
            <button
              id="btn-bottom-canvas-settings-contextual"
              type="button"
              onClick={onOpenCanvasSettings}
              className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl border transition-all cursor-pointer shrink-0 active:scale-95 ${
                isCanvasSettingsOpen
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-800'
              }`}
              title={isCanvasSettingsOpen ? 'Close Canvas Settings' : 'Canvas Settings (Dimensions, Background, Margins)'}
              aria-label="Canvas Settings"
            >
              <Settings size={15} className={isCanvasSettingsOpen ? 'text-white' : 'text-emerald-800'} />
              <span className="text-[9.5px] font-sans font-semibold leading-none mt-0.5 whitespace-nowrap">Canvas</span>
            </button>

            <div className="h-5 w-[1px] bg-stone-300 mx-0.5 shrink-0" />

            {/* 5. Layer Actions */}
            {/* Duplicate */}
            <button
              id="btn-bottom-duplicate"
              type="button"
              onClick={() => onDuplicateLayer(activeLayer.id)}
              className="flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 transition-all cursor-pointer shrink-0 active:scale-95"
              title="Duplicate Layer"
              aria-label="Duplicate Layer"
            >
              <Copy size={15} />
              <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Duplicate</span>
            </button>

            {/* Delete */}
            <button
              id="btn-bottom-delete"
              type="button"
              onClick={() => {
                onDeleteLayer(activeLayer.id);
                setActiveSheet('none');
              }}
              className="flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 transition-all cursor-pointer shrink-0 active:scale-95"
              title="Delete Layer"
              aria-label="Delete Layer"
            >
              <Trash2 size={15} />
              <span className="text-[9.5px] font-sans font-bold leading-none mt-0.5 whitespace-nowrap">Delete</span>
            </button>
          </div>
        ) : (
          /* DEFAULT TOOLBAR WHEN NO LAYER IS SELECTED */
          <div className="w-full flex items-center justify-between gap-1.5 py-0.5">
            {/* Add Text */}
            <button
              id="btn-bottom-add-layer"
              type="button"
              onClick={onAddNewText}
              className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer border border-emerald-800 font-sans"
              title="Add Text Layer"
              aria-label="Add Text Layer"
            >
              <Plus size={15} className="stroke-[2.5]" />
              <span className="text-xs font-bold whitespace-nowrap">Add Text</span>
            </button>

            {/* Layers */}
            <button
              id="btn-bottom-layers-unselected"
              type="button"
              onClick={onOpenLayersPanel}
              className={`relative py-1.5 px-2.5 rounded-xl border flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer font-sans ${
                isLayersPanelOpen
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'border-stone-300 bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-800'
              }`}
              title={isLayersPanelOpen ? 'Minimize Layers' : 'Manage Layers (Reorder, Group, Lock, Hide)'}
              aria-label="Layers Manager"
            >
              <Layers size={15} className={isLayersPanelOpen ? 'text-white' : 'text-emerald-800'} />
              <span className="text-xs font-semibold whitespace-nowrap">Layers</span>
              {layersCount > 0 && (
                <span
                  className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs ${
                    isLayersPanelOpen ? 'bg-white text-emerald-800' : 'bg-emerald-700 text-white'
                  }`}
                >
                  {layersCount}
                </span>
              )}
            </button>

            {/* Canvas Settings */}
            <button
              id="btn-bottom-canvas-settings-unselected"
              type="button"
              onClick={onOpenCanvasSettings}
              className={`py-1.5 px-2.5 rounded-xl border flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer font-sans ${
                isCanvasSettingsOpen
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'border-stone-300 bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-800'
              }`}
              title={isCanvasSettingsOpen ? 'Close Canvas Settings' : 'Canvas Settings (Dimensions, Background, Margins)'}
              aria-label="Canvas Settings"
            >
              <Settings size={15} className={isCanvasSettingsOpen ? 'text-white' : 'text-emerald-800'} />
              <span className="text-xs font-semibold whitespace-nowrap">Canvas</span>
            </button>

            {/* Snapping */}
            <button
              id="btn-bottom-snap-unselected"
              type="button"
              onClick={() => toggleSheet('snap')}
              className={`py-1.5 px-2.5 rounded-xl border flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer font-sans ${
                activeSheet === 'snap'
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : snapEnabled
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
              title={snapEnabled ? 'Magnet Snap: Enabled' : 'Magnet Snap: Disabled'}
              aria-label="Smart Snapping"
            >
              <Magnet size={15} className={activeSheet === 'snap' ? 'text-white' : snapEnabled ? 'text-emerald-700' : 'text-stone-600'} />
              <span className="text-xs font-semibold whitespace-nowrap hidden min-[360px]:inline">Snap</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
