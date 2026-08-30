import React, { useState, useRef } from 'react';
import { FontChoice, TextStyleProperties, TextLayer } from '../types';
import { getFontFamilyCSS, SYSTEM_FONTS } from '../lib/fontUtils';
import { addCustomFont, getCustomFonts, deleteCustomFont, CustomFontItem } from '../lib/customFonts';
import { LayerAlignmentType } from '../lib/layerUtils';
import { ColorGradientPicker } from './ColorGradientPicker';
import {
  Edit3,
  Type,
  Maximize2,
  Palette,
  Sliders,
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
  Check,
  RotateCcw,
  Sun,
  Contrast,
  FoldHorizontal,
  Baseline,
  Droplet,
  Square,
  FlipHorizontal,
  FlipVertical,
  Minus,
  MoveHorizontal,
  MoveVertical,
  Upload,
  Pilcrow,
  ArrowRightToLine,
  ArrowLeftToLine,
  Heading1,
  Heading2,
  BookOpen,
  Quote,
  Magnet,
  CheckCircle2,
} from 'lucide-react';

interface MobileTextDesignToolbarProps {
  activeLayer: TextLayer | null;
  layersCount?: number;
  currentStyle: TextStyleProperties;
  onUpdateStyle: (updates: Partial<TextStyleProperties>) => void;
  onOpenUnicodeEditor: () => void;
  onAddNewText: () => void;
  onDuplicateLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onBringToFront: (layerId: string) => void;
  onSendToBack: (layerId: string) => void;
  onOpenLayersPanel?: () => void;
  onOpenCanvasSettings?: () => void;
  onCenterHorizontally?: (layerId: string) => void;
  onCenterVertically?: (layerId: string) => void;
  onAlignLayers?: (layerIds: string[], alignment: LayerAlignmentType) => void;
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
  | 'paragraph'
  | 'style'
  | 'color'
  | 'effects'
  | 'border'
  | 'transform'
  | 'align'
  | 'snap';

const FONTS = SYSTEM_FONTS;

const COLOR_PRESETS = [
  { name: 'Black', color: '#1c1917' },
  { name: 'Slate', color: '#475569' },
  { name: 'Walnut', color: '#451a03' },
  { name: 'Saffron', color: '#d97706' },
  { name: 'Crimson', color: '#b91c1c' },
  { name: 'Emerald', color: '#047857' },
  { name: 'Teal', color: '#0f766e' },
  { name: 'Royal Blue', color: '#1d4ed8' },
  { name: 'Purple', color: '#6d28d9' },
  { name: 'Rose', color: '#db2777' },
  { name: 'Gold', color: '#eab308' },
  { name: 'Snow White', color: '#ffffff' },
];

const HIGHLIGHT_PRESETS = [
  '#fef3c7',
  '#fee2e2',
  '#dcfce7',
  '#e0e7ff',
  '#fef08a',
  '#ccfbf1',
  '#f3e8ff',
  '#ffe4e6',
  '#1c1917',
  '#0f172a',
];

const STROKE_COLORS = [
  '#ffffff',
  '#1c1917',
  '#047857',
  '#d97706',
  '#b91c1c',
  '#1d4ed8',
  '#eab308',
];

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
  onOpenUnicodeEditor,
  onAddNewText,
  onDuplicateLayer,
  onDeleteLayer,
  onBringToFront,
  onSendToBack,
  onOpenLayersPanel,
  onOpenCanvasSettings,
  onCenterHorizontally,
  onCenterVertically,
  onAlignLayers,
  selectedLayerIds = [],
  snapEnabled = true,
  onToggleSnap,
  snapSensitivity = 8,
  onChangeSnapSensitivity,
}) => {
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>('none');
  const [customFontsList, setCustomFontsList] = useState<CustomFontItem[]>(() => getCustomFonts());
  const fontFileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleSheet = (sheet: ActiveSheet) => {
    setActiveSheet((prev) => (prev === sheet ? 'none' : sheet));
  };

  const handleCustomFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const newItem = await addCustomFont(file);
      setCustomFontsList(getCustomFonts());
      onUpdateStyle({ fontFamily: newItem.name });
    } catch (err) {
      console.error('Error uploading custom font:', err);
      alert('Failed to load font file. Please ensure it is a valid .ttf, .otf, or .woff file.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteCustomFont = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteCustomFont(id);
    setCustomFontsList(getCustomFonts());
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
      {/* 1. EXPANDABLE BOTTOM DRAWER PANELS (High Contrast, Icon-Driven) */}
      {activeSheet !== 'none' && (activeLayer || activeSheet === 'snap') && (
        <div className="w-full bg-stone-50 border-b-2 border-stone-300 p-2.5 sm:p-3.5 max-h-[250px] sm:max-h-[290px] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-300">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
              {activeSheet === 'font' && <Type size={16} className="text-emerald-800" />}
              {activeSheet === 'size' && <Maximize2 size={16} className="text-emerald-800" />}
              {activeSheet === 'style' && <Sliders size={16} className="text-emerald-800" />}
              {activeSheet === 'paragraph' && <Pilcrow size={16} className="text-emerald-800" />}
              {activeSheet === 'color' && <Palette size={16} className="text-emerald-800" />}
              {activeSheet === 'border' && <Square size={16} className="text-emerald-800" />}
              {activeSheet === 'effects' && <Sparkles size={16} className="text-emerald-800" />}
              {activeSheet === 'transform' && <Move size={16} className="text-emerald-800" />}
              {activeSheet === 'align' && <AlignLeft size={16} className="text-emerald-800" />}
              {activeSheet === 'snap' && <Magnet size={16} className="text-emerald-800" />}
              <span className="capitalize font-sans font-bold">
                {activeSheet === 'font' && 'Font Family'}
                {activeSheet === 'size' && 'Size & Spacing'}
                {activeSheet === 'style' && 'Text Style & Decoration'}
                {activeSheet === 'paragraph' && 'Paragraph & Direction'}
                {activeSheet === 'color' && 'Color & Highlight'}
                {activeSheet === 'border' && 'Corner Radius & Border'}
                {activeSheet === 'effects' && 'Shadow & Effects'}
                {activeSheet === 'transform' && 'Transform & Position'}
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

          {/* SIZE & SPACING SHEET */}
          {activeSheet === 'size' && (
            <div className="flex flex-col gap-3">
              {/* Font Size */}
              <div>
                <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Maximize2 size={14} className="text-emerald-800" />
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
            </div>
          )}

          {/* PARAGRAPH & DIRECTION SHEET */}
          {activeSheet === 'paragraph' && (
            <div className="flex flex-col gap-3">
              {/* LTR / RTL Direction Selection */}
              <div>
                <div className="text-[11px] font-bold text-stone-700 font-sans uppercase tracking-wider mb-1">
                  Text Direction (LTR / RTL)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateStyle({ direction: 'rtl' })}
                    className={`h-9 rounded-xl border-2 flex items-center justify-center gap-1.5 font-sans text-xs font-bold transition-all cursor-pointer ${
                      currentStyle.direction === 'rtl' || !currentStyle.direction
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-200'
                    }`}
                    title="Right to Left (RTL)"
                  >
                    <ArrowRightToLine size={15} />
                    <span>RTL (Right-to-Left)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateStyle({ direction: 'ltr' })}
                    className={`h-9 rounded-xl border-2 flex items-center justify-center gap-1.5 font-sans text-xs font-bold transition-all cursor-pointer ${
                      currentStyle.direction === 'ltr'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-200'
                    }`}
                    title="Left to Right (LTR)"
                  >
                    <ArrowLeftToLine size={15} />
                    <span>LTR (English)</span>
                  </button>
                </div>
              </div>

              {/* Alignments */}
              <div>
                <div className="text-[11px] font-bold text-stone-700 font-sans uppercase tracking-wider mb-1">
                  Alignment
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateStyle({ align: 'right' })}
                    className={`flex-1 h-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                      currentStyle.align === 'right' || !currentStyle.align
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
                      currentStyle.align === 'center'
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
                      currentStyle.align === 'left'
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
                      currentStyle.align === 'justify'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-200'
                    }`}
                    title="Justify"
                  >
                    <AlignJustify size={16} />
                  </button>
                </div>
              </div>

              {/* Paragraph Presets */}
              <div>
                <div className="text-[11px] font-bold text-stone-700 font-sans uppercase tracking-wider mb-1">
                  Paragraph Type
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateStyle({
                        fontSize: 36,
                        bold: true,
                        lineHeight: 2.3,
                      })
                    }
                    className="py-1.5 px-2 rounded-xl bg-white border border-stone-300 hover:bg-emerald-50 text-stone-900 text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 shadow-2xs"
                  >
                    <Heading1 size={14} className="text-emerald-700" />
                    <span className="text-[10px] font-bold">Title</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateStyle({
                        fontSize: 28,
                        bold: true,
                        lineHeight: 2.1,
                      })
                    }
                    className="py-1.5 px-2 rounded-xl bg-white border border-stone-300 hover:bg-emerald-50 text-stone-900 text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 shadow-2xs"
                  >
                    <Heading2 size={14} className="text-emerald-700" />
                    <span className="text-[10px] font-bold">Heading</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateStyle({
                        fontSize: 22,
                        bold: false,
                        lineHeight: 2.6,
                      })
                    }
                    className="py-1.5 px-2 rounded-xl bg-white border border-stone-300 hover:bg-emerald-50 text-stone-900 text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 shadow-2xs"
                  >
                    <BookOpen size={14} className="text-emerald-700" />
                    <span className="text-[10px] font-bold">Body</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateStyle({
                        fontSize: 26,
                        bold: false,
                        lineHeight: 2.8,
                        align: 'center',
                      })
                    }
                    className="py-1.5 px-2 rounded-xl bg-white border border-stone-300 hover:bg-emerald-50 text-stone-900 text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 shadow-2xs"
                  >
                    <Sparkles size={14} className="text-amber-600" />
                    <span className="text-[10px] font-bold">Poetry</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STYLE & ALIGNMENT SHEET */}
          {activeSheet === 'style' && (
            <div className="flex flex-col gap-3">
              {/* Bold, Italic, Underline */}
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
              </div>

              {/* Alignments */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateStyle({ align: 'right' })}
                  className={`flex-1 h-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                    currentStyle.align === 'right' || !currentStyle.align
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-200'
                  }`}
                  title="Right"
                >
                  <AlignRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateStyle({ align: 'center' })}
                  className={`flex-1 h-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                    currentStyle.align === 'center'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-200'
                  }`}
                  title="Center"
                >
                  <AlignCenter size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateStyle({ align: 'left' })}
                  className={`flex-1 h-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                    currentStyle.align === 'left'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-200'
                  }`}
                  title="Left"
                >
                  <AlignLeft size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateStyle({ align: 'justify' })}
                  className={`flex-1 h-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                    currentStyle.align === 'justify'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-200'
                  }`}
                  title="Justify"
                >
                  <AlignJustify size={16} />
                </button>
              </div>
            </div>
          )}

          {/* COLOR & HIGHLIGHT SHEET */}
          {activeSheet === 'color' && (
            <div className="flex flex-col gap-3 py-1">
              {/* Text Color & Gradient System */}
              <div className="p-2.5 bg-stone-50/80 rounded-xl border border-stone-200">
                <ColorGradientPicker
                  label="Text Color"
                  value={currentStyle.gradient || currentStyle.color || '#1c1917'}
                  gradientValue={currentStyle.gradient}
                  allowNone={false}
                  onChange={(res) => {
                    if (res.type === 'gradient') {
                      onUpdateStyle({
                        gradient: res.gradient,
                        colorType: 'gradient',
                      });
                    } else {
                      onUpdateStyle({
                        color: res.color || '#1c1917',
                        gradient: undefined,
                        colorType: 'solid',
                      });
                    }
                  }}
                />
              </div>

              {/* Card / Background Highlight Fill */}
              <div className="p-2.5 bg-stone-50/80 rounded-xl border border-stone-200">
                <ColorGradientPicker
                  label="Card / Highlight"
                  value={currentStyle.highlightGradient || currentStyle.highlightColor || ''}
                  gradientValue={currentStyle.highlightGradient}
                  allowNone={true}
                  noneLabel="None"
                  onChange={(res) => {
                    if (res.type === 'none') {
                      onUpdateStyle({
                        highlightColor: undefined,
                        highlightGradient: undefined,
                        highlightType: 'none',
                      });
                    } else if (res.type === 'gradient') {
                      onUpdateStyle({
                        highlightGradient: res.gradient,
                        highlightColor: undefined,
                        highlightType: 'gradient',
                      });
                    } else {
                      onUpdateStyle({
                        highlightColor: res.color,
                        highlightGradient: undefined,
                        highlightType: 'solid',
                      });
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* BORDER, SHAPE & PADDING SHEET */}
          {activeSheet === 'border' && (
            <div className="flex flex-col gap-3">
              {/* Corner Radius & Inner Padding */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                    <span className="font-sans">Corner Radius</span>
                    <span className="font-mono">{currentStyle.borderRadius || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="2"
                    value={currentStyle.borderRadius || 0}
                    onChange={(e) => onUpdateStyle({ borderRadius: parseInt(e.target.value, 10) })}
                    className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                    <span className="font-sans">Padding</span>
                    <span className="font-mono">{currentStyle.padding !== undefined ? currentStyle.padding : 6}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    step="2"
                    value={currentStyle.padding !== undefined ? currentStyle.padding : 6}
                    onChange={(e) => onUpdateStyle({ padding: parseInt(e.target.value, 10) })}
                    className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Border Width & Color */}
              <div className="pt-2 border-t border-stone-300">
                <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                  <span className="font-sans">Border Width</span>
                  <span className="font-mono">{currentStyle.borderWidth || 0}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={currentStyle.borderWidth || 0}
                  onChange={(e) => {
                    const bw = parseInt(e.target.value, 10);
                    onUpdateStyle({
                      borderWidth: bw,
                      borderColor: bw > 0 ? (currentStyle.borderColor || '#d97706') : undefined,
                    });
                  }}
                  className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                />
              </div>

              {/* Border Color Presets */}
              {(currentStyle.borderWidth || 0) > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                  {STROKE_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => onUpdateStyle({ borderColor: col })}
                      className={`w-7 h-7 rounded-lg border-2 border-stone-300 transition-all ${
                        currentStyle.borderColor === col ? 'ring-2 ring-emerald-700 scale-110' : ''
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EFFECTS: SHADOW & OUTLINE SHEET */}
          {activeSheet === 'effects' && (
            <div className="flex flex-col gap-3">
              {/* Text Shadow */}
              <div>
                <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <Sparkles size={14} className="text-emerald-800" />
                  </span>
                  <span className="font-mono font-bold text-stone-950 text-xs">
                    {currentStyle.shadowBlur || 0}px
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={currentStyle.shadowBlur || 0}
                    onChange={(e) => {
                      const blur = parseInt(e.target.value, 10);
                      onUpdateStyle({
                        shadowBlur: blur,
                        shadowColor: blur > 0 ? (currentStyle.shadowColor || 'rgba(0,0,0,0.5)') : undefined,
                      });
                    }}
                    className="flex-1 accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateStyle({ shadowBlur: 0, shadowColor: undefined })}
                    className="w-7 h-7 rounded-lg bg-white border border-stone-300 text-stone-800 hover:bg-stone-200 flex items-center justify-center"
                    title="Remove Shadow"
                  >
                    <Minus size={12} />
                  </button>
                </div>

                {/* Shadow Color Presets */}
                {(currentStyle.shadowBlur || 0) > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                    {SHADOW_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => onUpdateStyle({ shadowColor: col })}
                        className={`w-7 h-7 rounded-full border border-stone-300 transition-all ${
                          currentStyle.shadowColor === col ? 'ring-2 ring-emerald-700 scale-110' : ''
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Outline Stroke Width */}
              <div className="pt-2 border-t border-stone-300">
                <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <Contrast size={14} className="text-emerald-800" />
                  </span>
                  <span className="font-mono font-bold text-stone-950 text-xs">
                    {currentStyle.strokeWidth || 0}px
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.5"
                    value={currentStyle.strokeWidth || 0}
                    onChange={(e) => {
                      const width = parseFloat(e.target.value);
                      onUpdateStyle({
                        strokeWidth: width,
                        strokeColor: width > 0 ? (currentStyle.strokeColor || '#ffffff') : undefined,
                      });
                    }}
                    className="flex-1 accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateStyle({ strokeWidth: 0, strokeColor: undefined })}
                    className="w-7 h-7 rounded-lg bg-white border border-stone-300 text-stone-800 hover:bg-stone-200 flex items-center justify-center"
                    title="Remove Stroke"
                  >
                    <Minus size={12} />
                  </button>
                </div>
              </div>

              {/* Opacity */}
              <div className="pt-2 border-t border-stone-300">
                <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <Sun size={14} className="text-emerald-800" />
                  </span>
                  <span className="font-mono font-bold text-stone-950 text-xs">
                    {Math.round((currentStyle.opacity ?? 1) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={currentStyle.opacity ?? 1}
                  onChange={(e) => onUpdateStyle({ opacity: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* TRANSFORM, FLIP & ROTATION SHEET */}
          {activeSheet === 'transform' && (
            <div className="flex flex-col gap-3">
              {/* Rotation Slider */}
              <div>
                <div className="flex items-center justify-between text-xs text-stone-900 font-bold mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <RotateCw size={14} className="text-emerald-800" />
                    <span>Rotation Angle</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-950 text-xs">
                      {Math.round(currentStyle.rotation || 0)}°
                    </span>
                    {(currentStyle.rotation || 0) !== 0 && (
                      <button
                        type="button"
                        onClick={() => onUpdateStyle({ rotation: 0 })}
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                        title="Reset Rotation to 0°"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={currentStyle.rotation || 0}
                  onChange={(e) => onUpdateStyle({ rotation: parseInt(e.target.value, 10) })}
                  className="w-full accent-emerald-700 cursor-pointer h-2 bg-stone-300 rounded-lg"
                />
              </div>

              {/* Quick Flip & Center Tools */}
              <div>
                <div className="text-[11px] font-bold text-stone-700 font-sans uppercase tracking-wider mb-1.5">
                  Flip & Center on Stage
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateStyle({ flipX: !currentStyle.flipX })}
                    className={`h-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
                      currentStyle.flipX
                        ? 'bg-emerald-700 text-white border-emerald-800'
                        : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-200'
                    }`}
                    title="Flip Horizontal"
                  >
                    <FlipHorizontal size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateStyle({ flipY: !currentStyle.flipY })}
                    className={`h-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
                      currentStyle.flipY
                        ? 'bg-emerald-700 text-white border-emerald-800'
                        : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-200'
                    }`}
                    title="Flip Vertical"
                  >
                    <FlipVertical size={16} />
                  </button>

                  {onCenterHorizontally && (
                    <button
                      type="button"
                      onClick={() => onCenterHorizontally(activeLayer.id)}
                      className="h-9 rounded-xl bg-white border-2 border-stone-300 text-stone-900 hover:bg-stone-200 flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
                      title="Center Horizontally on Canvas"
                    >
                      <MoveHorizontal size={16} />
                    </button>
                  )}

                  {onCenterVertically && (
                    <button
                      type="button"
                      onClick={() => onCenterVertically(activeLayer.id)}
                      className="h-9 rounded-xl bg-white border-2 border-stone-300 text-stone-900 hover:bg-stone-200 flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
                      title="Center Vertically on Canvas"
                    >
                      <MoveVertical size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Layer Stacking Order & Quick Actions */}
              <div className="pt-2 border-t border-stone-300">
                <div className="text-[11px] font-bold text-stone-700 font-sans uppercase tracking-wider mb-1.5">
                  Layer Order & Actions
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => onBringToFront(activeLayer.id)}
                    className="h-9 rounded-xl bg-white border-2 border-stone-300 text-stone-900 hover:bg-stone-200 flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                    title="Bring to Front"
                  >
                    <ArrowUp size={15} />
                    <span className="text-[10px] font-sans font-bold">Front</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSendToBack(activeLayer.id)}
                    className="h-9 rounded-xl bg-white border-2 border-stone-300 text-stone-900 hover:bg-stone-200 flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                    title="Send to Back"
                  >
                    <ArrowDown size={15} />
                    <span className="text-[10px] font-sans font-bold">Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateLayer(activeLayer.id)}
                    className="h-9 rounded-xl bg-white border-2 border-stone-300 text-stone-900 hover:bg-stone-200 flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                    title="Duplicate Layer"
                  >
                    <Copy size={15} />
                    <span className="text-[10px] font-sans font-bold">Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteLayer(activeLayer.id);
                      setActiveSheet('none');
                    }}
                    className="h-9 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-800 hover:bg-rose-100 flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                    title="Delete Layer"
                  >
                    <Trash2 size={15} />
                    <span className="text-[10px] font-sans font-bold">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ALIGNMENT & DISTRIBUTION SHEET */}
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

          {/* SMART SNAPPING & DYNAMIC GUIDES SHEET */}
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
                <div className="flex justify-between text-[10px] text-stone-500 font-mono font-semibold">
                  <span>Tight (4px)</span>
                  <span>Balanced (8px)</span>
                  <span>Strong (20px)</span>
                </div>
              </div>

              {/* Dynamic Guide Color Legend */}
              <div className="grid grid-cols-3 gap-2 text-[10px] font-sans font-semibold">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-1.5 text-emerald-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <span>Canvas Center</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-1.5 text-amber-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Margins</span>
                </div>
                <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center gap-1.5 text-indigo-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                  <span>Layer Align</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PRIMARY BOTTOM NAVIGATION BAR (Clean, Professional & Highly Contextual) */}
      <div className="w-full px-1.5 sm:px-3 py-1 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        {activeLayer ? (
          /* When a text layer is selected: Contextual typography and design tools with direct Layers & Canvas access */
          <div className="w-full flex items-center justify-between gap-1 min-w-max">
            {/* Primary Action: Edit Unicode Text in Native Mode */}
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

            {/* Font Picker Trigger */}
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

            {/* Size & Spacing Trigger */}
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
              aria-label="Size & Spacing"
            >
              <Maximize2 size={15} />
              <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Size</span>
            </button>

            {/* Color Palette Trigger */}
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
              aria-label="Color & Background"
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-stone-400 shadow-xs shrink-0"
                style={{ backgroundColor: currentStyle.color || '#1c1917' }}
              />
              <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Color</span>
            </button>

            {/* Style & Alignment Trigger */}
            <button
              id="btn-bottom-style"
              type="button"
              onClick={() => toggleSheet('style')}
              className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                activeSheet === 'style'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
              }`}
              title="Style & Align"
              aria-label="Style & Align"
            >
              <Sliders size={15} />
              <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Style</span>
            </button>

            {/* Paragraph & Direction Trigger */}
            <button
              id="btn-bottom-paragraph"
              type="button"
              onClick={() => toggleSheet('paragraph')}
              className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                activeSheet === 'paragraph'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
              }`}
              title="Paragraph & Direction (LTR/RTL)"
              aria-label="Paragraph & Direction"
            >
              <Pilcrow size={15} />
              <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Format</span>
            </button>

            {/* Border & Corner Radius Shape Trigger */}
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
              aria-label="Corner Radius & Border"
            >
              <Square size={15} />
              <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Border</span>
            </button>

            {/* Effects (Shadow, Outline, Opacity) */}
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
              aria-label="Effects & Shadow"
            >
              <Sparkles size={15} />
              <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Effects</span>
            </button>

            {/* Transform & Layers Order */}
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
              aria-label="Position, Flip & Reorder"
            >
              <Move size={15} />
              <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Position</span>
            </button>

            {/* Align to Bounds Trigger */}
            <button
              id="btn-bottom-align"
              type="button"
              onClick={() => toggleSheet('align')}
              className={`flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl transition-all cursor-pointer shrink-0 border ${
                activeSheet === 'align'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
              }`}
              title="Align to Selection Bounds (6 Edges)"
              aria-label="Align to Selection Bounds"
            >
              <AlignLeft size={15} />
              <span className="text-[9.5px] font-sans font-medium leading-none mt-0.5 whitespace-nowrap">Align</span>
            </button>

            {/* Vertical Divider */}
            <div className="h-6 w-[1px] bg-stone-300 mx-0.5 shrink-0" />

            {/* Layers Panel Access */}
            <button
              id="btn-bottom-layers-contextual"
              type="button"
              onClick={onOpenLayersPanel}
              className="relative flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 transition-all cursor-pointer shrink-0 active:scale-95"
              title="Layers Manager"
              aria-label="Layers Manager"
            >
              <Layers size={15} className="text-emerald-800" />
              <span className="text-[9.5px] font-sans font-semibold leading-none mt-0.5 whitespace-nowrap">Layers</span>
              {layersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-700 text-white text-[8.5px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {layersCount}
                </span>
              )}
            </button>

            {/* Canvas Settings Access */}
            <button
              id="btn-bottom-canvas-settings-contextual"
              type="button"
              onClick={onOpenCanvasSettings}
              className="flex flex-col items-center justify-center min-w-[42px] h-10 py-0.5 px-1 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 transition-all cursor-pointer shrink-0 active:scale-95"
              title="Canvas Settings (Dimensions, Background, Margins)"
              aria-label="Canvas Settings"
            >
              <Settings size={15} className="text-emerald-800" />
              <span className="text-[9.5px] font-sans font-semibold leading-none mt-0.5 whitespace-nowrap">Canvas</span>
            </button>

            {/* Quick Duplicate Active Layer */}
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

            {/* Quick Delete Active Layer */}
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
          /* When no layer is selected: High-utility, beautifully organized Canvas & Layers toolbar */
          <div className="w-full flex items-center justify-between gap-1.5 py-0.5">
            {/* Primary Action: Add Text Layer */}
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

            {/* Layers Manager Button */}
            <button
              id="btn-bottom-layers-unselected"
              type="button"
              onClick={onOpenLayersPanel}
              className="relative py-1.5 px-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-800 flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer font-sans"
              title="Manage Layers (Reorder, Group, Lock, Hide)"
              aria-label="Layers Manager"
            >
              <Layers size={15} className="text-emerald-800" />
              <span className="text-xs font-semibold whitespace-nowrap">Layers</span>
              {layersCount > 0 && (
                <span className="bg-emerald-700 text-white text-[9.5px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
                  {layersCount}
                </span>
              )}
            </button>

            {/* Canvas Settings Button */}
            <button
              id="btn-bottom-canvas-settings-unselected"
              type="button"
              onClick={onOpenCanvasSettings}
              className="py-1.5 px-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-800 flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer font-sans"
              title="Canvas Settings (Dimensions, Background, Margins)"
              aria-label="Canvas Settings"
            >
              <Settings size={15} className="text-emerald-800" />
              <span className="text-xs font-semibold whitespace-nowrap">Canvas</span>
            </button>

            {/* Smart Snapping & Guides Toggle */}
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
