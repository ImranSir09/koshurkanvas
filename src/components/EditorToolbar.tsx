import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  ArrowUpToLine,
  ArrowDownToLine,
  Type,
  Palette,
  Highlighter,
  Sliders,
  RotateCcw,
  Check,
  ChevronDown,
  WrapText,
  Upload,
  Trash2,
} from 'lucide-react';
import { FontChoice, TextStyleProperties } from '../types';
import { addCustomFont, getCustomFonts, deleteCustomFont, CustomFontItem } from '../lib/customFonts';

interface EditorToolbarProps {
  currentStyle: TextStyleProperties;
  onUpdateStyle: (updates: Partial<TextStyleProperties>) => void;
  onClearFormatting: () => void;
  onInsertLineBreak?: () => void;
  onInsertKashida?: () => void;
  selectionCount?: number;
  isSelectionActive?: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  currentStyle,
  onUpdateStyle,
  onClearFormatting,
  onInsertLineBreak,
  onInsertKashida,
  selectionCount = 0,
  isSelectionActive = false,
}) => {
  const [openPicker, setOpenPicker] = useState<
    'none' | 'font' | 'color' | 'highlight' | 'spacing' | 'fx' | 'canvas'
  >('none');
  const [customFontsList, setCustomFontsList] = useState<CustomFontItem[]>(() => getCustomFonts());
  const fontFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCustomFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const newItem = await addCustomFont(file);
      setCustomFontsList(getCustomFonts());
      onUpdateStyle({ fontFamily: newItem.name });
      setOpenPicker('none');
    } catch (err) {
      console.error('Error uploading custom font:', err);
      alert('Failed to load font file. Please ensure it is a valid .ttf, .otf, or .woff file.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const fonts: { id: FontChoice; name: string }[] = [
    { id: 'Noto Nastaliq Urdu', name: 'Noto Nastaliq Urdu (Primary)' },
    { id: 'Gulzar', name: 'Gulzar Nastaliq' },
    { id: 'Amiri', name: 'Amiri Naskh' },
    { id: 'Noto Sans Arabic', name: 'Noto Sans Arabic' },
  ];

  const quickColors = [
    '#1c1917', // stone-900
    '#b45309', // amber-700
    '#b91c1c', // red-700
    '#047857', // emerald-700
    '#1d4ed8', // blue-700
    '#6d28d9', // purple-700
    '#d97706', // amber-500
    '#f59e0b', // amber-400
    '#fafaf9', // stone-50
  ];

  const quickHighlights = [
    'transparent',
    '#fef3c7', // amber-100
    '#fee2e2', // red-100
    '#dcfce7', // emerald-100
    '#e0e7ff', // indigo-100
    '#fef08a', // yellow-200
  ];

  return (
    <div
      id="editor-formatting-toolbar"
      className="w-full bg-white border-t border-b border-stone-200 px-3 py-2 flex flex-col z-30 transition-colors"
    >
      {/* Horizontally Scrollable Main Bar */}
      <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth [-webkit-overflow-scrolling:touch] custom-scrollbar py-0.5" dir="rtl">
        {/* Selection Status Badge with Enhanced Style Summary */}
        {isSelectionActive && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-xs font-semibold text-emerald-900 font-sans">
              {selectionCount} chars • {currentStyle.fontSize}px • {currentStyle.fontFamily.split(' ')[0]}
            </span>
          </div>
        )}

        {/* Font Family Dropdown Button */}
        <div className="relative shrink-0">
          <button
            id="toolbar-font-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpenPicker(openPicker === 'font' ? 'none' : 'font')}
            className={`h-8 px-2 rounded-lg flex items-center gap-1 text-xs border transition-colors cursor-pointer ${
              openPicker === 'font'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-stone-800 border-stone-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
            }`}
            title="Font Family"
          >
            <span className="w-5 h-5 rounded flex items-center justify-center bg-stone-100 text-stone-800 font-serif font-bold text-xs border border-stone-300 shadow-2xs">F</span>
            <ChevronDown size={12} />
          </button>
        </div>

        {/* Font Size (+ / -) */}
        <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5 shrink-0">
          <button
            id="font-size-dec-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ fontSize: Math.max(8, currentStyle.fontSize - 2) })}
            className="w-7 h-7 flex items-center justify-center text-xs font-bold text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-md transition-colors cursor-pointer"
          >
            A-
          </button>
          <span className="px-1.5 text-xs font-semibold font-sans text-stone-900 min-w-[24px] text-center">
            {currentStyle.fontSize}
          </span>
          <button
            id="font-size-inc-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ fontSize: Math.min(100, currentStyle.fontSize + 2) })}
            className="w-7 h-7 flex items-center justify-center text-xs font-bold text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-md transition-colors cursor-pointer"
          >
            A+
          </button>
        </div>

        {/* Bold, Italic, Underline */}
        <div className="flex items-center gap-0.5 bg-white border border-stone-200 rounded-lg p-0.5 shrink-0">
          <button
            id="toolbar-bold-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ bold: !currentStyle.bold })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.bold
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Bold"
          >
            <Bold size={14} />
          </button>

          <button
            id="toolbar-italic-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ italic: !currentStyle.italic })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.italic
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Italic"
          >
            <Italic size={14} />
          </button>

          <button
            id="toolbar-underline-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ underline: !currentStyle.underline })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.underline
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Underline"
          >
            <Underline size={14} />
          </button>
        </div>

        {/* Text Color Picker Trigger */}
        <button
          id="toolbar-color-btn"
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpenPicker(openPicker === 'color' ? 'none' : 'color')}
          className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs border transition-colors shrink-0 cursor-pointer ${
            openPicker === 'color'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white text-stone-800 border-stone-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
          }`}
          title="Text Color"
        >
          <Palette size={14} />
          <span
            className="w-3.5 h-3.5 rounded-full border border-stone-300"
            style={{ backgroundColor: currentStyle.color }}
          />
        </button>

        {/* Highlight Color Picker Trigger */}
        <button
          id="toolbar-highlight-btn"
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpenPicker(openPicker === 'highlight' ? 'none' : 'highlight')}
          className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs border transition-colors shrink-0 cursor-pointer ${
            openPicker === 'highlight'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white text-stone-800 border-stone-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
          }`}
          title="Highlight Background Color"
        >
          <Highlighter size={14} />
          <span
            className="w-3.5 h-3.5 rounded-full border border-stone-300"
            style={{ backgroundColor: currentStyle.highlightColor || 'transparent' }}
          />
        </button>

        {/* Alignment Controls (Right, Center, Left, Justify, Top, Bottom) */}
        <div className="flex items-center gap-0.5 bg-white border border-stone-200 rounded-lg p-0.5 shrink-0">
          <button
            id="align-right-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ align: 'right' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.align === 'right'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Right Align"
          >
            <AlignRight size={14} />
          </button>
          <button
            id="align-center-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ align: 'center' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.align === 'center'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Center Align"
          >
            <AlignCenter size={14} />
          </button>
          <button
            id="align-left-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ align: 'left' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.align === 'left'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Left Align"
          >
            <AlignLeft size={14} />
          </button>
          <button
            id="align-justify-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ align: 'justify' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.align === 'justify'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Justify Align"
          >
            <AlignJustify size={14} />
          </button>
          <button
            id="align-top-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ verticalAlign: 'top' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.verticalAlign === 'top'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Top Align"
          >
            <ArrowUpToLine size={14} />
          </button>
          <button
            id="align-bottom-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onUpdateStyle({ verticalAlign: 'bottom' })}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentStyle.verticalAlign === 'bottom'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
            title="Bottom Align"
          >
            <ArrowDownToLine size={14} />
          </button>
        </div>

        {/* Kashida (ـ Tatweel) Quick Insert */}
        <button
          id="toolbar-kashida-btn"
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (onInsertKashida) {
              onInsertKashida();
            } else {
              onUpdateStyle({ kashida: !currentStyle.kashida });
            }
          }}
          className="h-8 px-2 sm:px-2.5 rounded-lg flex items-center gap-1 text-xs text-stone-800 bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200 hover:border-emerald-200 transition-colors shrink-0 cursor-pointer"
          title="Insert Kashida (ـ)"
        >
          <span className="font-bold text-sm text-emerald-700">ـ</span>
        </button>

        {/* Line Break (New Line) Quick Action */}
        {onInsertLineBreak && (
          <button
            id="toolbar-linebreak-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onInsertLineBreak}
            className="h-8 px-2 sm:px-2.5 rounded-lg flex items-center gap-1 text-xs text-stone-800 bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200 hover:border-emerald-200 transition-colors shrink-0 cursor-pointer"
            title="Line Break"
          >
            <WrapText size={13} className="shrink-0" />
          </button>
        )}

        {/* Spacing & FX Popover Trigger */}
        <button
          id="toolbar-fx-btn"
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpenPicker(openPicker === 'fx' ? 'none' : 'fx')}
          className={`h-8 px-2.5 rounded-lg flex items-center gap-1 text-xs border transition-colors shrink-0 cursor-pointer ${
            openPicker === 'fx'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white text-stone-800 border-stone-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
          }`}
          title="Line Height, Letter Spacing & Shadows"
        >
          <Sliders size={14} />
        </button>

        {/* Clear Formatting Button */}
        <button
          id="toolbar-clear-btn"
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClearFormatting}
          className="h-8 px-2.5 rounded-lg flex items-center gap-1 text-xs text-stone-800 bg-white hover:bg-rose-50 hover:text-rose-700 border border-stone-200 hover:border-rose-200 transition-colors shrink-0 cursor-pointer"
          title="Clear Formatting"
        >
          <RotateCcw size={12} />
        </button>
      </div>



      {/* Sub-panels for Font, Color, FX */}
      {openPicker === 'font' && (
        <div className="pt-1.5 pb-1 border-t border-stone-200 flex flex-wrap items-center gap-1.5 animate-in slide-in-from-top-2" dir="rtl">
          <input
            ref={fontFileInputRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            onChange={handleCustomFontUpload}
            className="hidden"
          />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => fontFileInputRef.current?.click()}
            className="px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 border-2 border-dashed border-emerald-600 bg-emerald-50 text-emerald-950 font-bold hover:bg-emerald-100 transition-colors cursor-pointer font-sans"
            title="Upload Custom Font (.TTF, .OTF, .WOFF)"
          >
            <Upload size={13} className="text-emerald-700 shrink-0" />
            <span>Upload Custom Font</span>
          </button>

          {/* Uploaded custom fonts */}
          {customFontsList.map((cf) => (
            <div
              key={cf.id}
              onClick={() => {
                onUpdateStyle({ fontFamily: cf.name });
                setOpenPicker('none');
              }}
              className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 border transition-colors cursor-pointer ${
                currentStyle.fontFamily === cf.name
                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                  : 'bg-white border-stone-200 text-stone-900 hover:bg-emerald-50 hover:border-emerald-200'
              }`}
            >
              <span style={{ fontFamily: `'${cf.name}', serif` }}>{cf.name}</span>
              {currentStyle.fontFamily === cf.name && <Check size={12} className="text-white shrink-0" />}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCustomFont(cf.id);
                  setCustomFontsList(getCustomFonts());
                }}
                className="hover:text-red-300 mr-1"
                title="Delete font"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}

          {/* Built-in fonts */}
          {fonts.map((f) => (
            <button
              key={f.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onUpdateStyle({ fontFamily: f.id });
                setOpenPicker('none');
              }}
              className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 border transition-colors cursor-pointer font-sans ${
                currentStyle.fontFamily === f.id
                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                  : 'bg-white border-stone-200 text-stone-900 hover:bg-emerald-50 hover:border-emerald-200'
              }`}
            >
              <span>{f.name}</span>
              {currentStyle.fontFamily === f.id && <Check size={12} className="text-white shrink-0" />}
            </button>
          ))}
        </div>
      )}

      {openPicker === 'color' && (
        <div className="pt-2 pb-1 border-t border-stone-200 flex items-center gap-2 overflow-x-auto no-scrollbar animate-in slide-in-from-top-2">
          <span className="text-xs font-sans font-medium text-stone-900 shrink-0">Text Color:</span>
          {quickColors.map((col, idx) => (
            <button
              key={idx}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onUpdateStyle({ color: col });
                setOpenPicker('none');
              }}
              className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center shrink-0 active:scale-90 transition-transform cursor-pointer"
              style={{ backgroundColor: col }}
            >
              {currentStyle.color === col && (
                <Check size={14} className={col === '#fafaf9' || col === '#f59e0b' ? 'text-stone-900' : 'text-white'} />
              )}
            </button>
          ))}
          {/* Native Color Input */}
          <input
            type="color"
            value={currentStyle.color.startsWith('#') ? currentStyle.color : '#1c1917'}
            onChange={(e) => onUpdateStyle({ color: e.target.value })}
            className="w-7 h-7 rounded-full cursor-pointer border border-stone-300 shrink-0"
            title="Custom Color"
          />
        </div>
      )}

      {openPicker === 'highlight' && (
        <div className="pt-2 pb-1 border-t border-stone-200 flex items-center gap-2 overflow-x-auto no-scrollbar animate-in slide-in-from-top-2">
          <span className="text-xs font-sans font-medium text-stone-900 shrink-0">Highlight Color:</span>
          {quickHighlights.map((hl, idx) => (
            <button
              key={idx}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onUpdateStyle({ highlightColor: hl === 'transparent' ? undefined : hl });
                setOpenPicker('none');
              }}
              className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center shrink-0 active:scale-90 transition-transform cursor-pointer"
              style={{ backgroundColor: hl === 'transparent' ? '#ffffff' : hl }}
            >
              {hl === 'transparent' ? (
                <span className="text-[10px] text-stone-700 font-bold">X</span>
              ) : currentStyle.highlightColor === hl ? (
                <Check size={14} className="text-stone-900" />
              ) : null}
            </button>
          ))}
        </div>
      )}

      {openPicker === 'fx' && (
        <div className="pt-2 pb-2 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in slide-in-from-top-2 text-left" dir="ltr">
          {/* Line Spacing Presets & Slider */}
          <div className="flex flex-col gap-1.5 bg-stone-50 p-2 rounded-lg border border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold font-sans text-stone-900">Line Height</span>
              <span className="text-xs font-mono font-bold text-emerald-700">{currentStyle.lineHeight.toFixed(1)}x</span>
            </div>
            <div className="flex items-center gap-1">
              {[1.5, 2.0, 2.5, 3.0].map((lh) => (
                <button
                  key={lh}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onUpdateStyle({ lineHeight: lh })}
                  className={`flex-1 h-6 text-[11px] rounded font-mono border transition-colors cursor-pointer ${
                    Math.abs(currentStyle.lineHeight - lh) < 0.05
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-emerald-50'
                  }`}
                >
                  {lh}x
                </button>
              ))}
            </div>
            <input
              type="range"
              min="1.0"
              max="3.5"
              step="0.1"
              value={currentStyle.lineHeight}
              onChange={(e) => onUpdateStyle({ lineHeight: parseFloat(e.target.value) })}
              className="accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer mt-1"
            />
          </div>

          {/* Letter Spacing & Opacity */}
          <div className="flex flex-col gap-2 bg-stone-50 p-2 rounded-lg border border-stone-200">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold font-sans text-stone-900">Letter Spacing</span>
                <span className="text-xs font-mono font-bold text-emerald-700">{currentStyle.letterSpacing}px</span>
              </div>
              <input
                type="range"
                min="-2"
                max="12"
                step="0.5"
                value={currentStyle.letterSpacing}
                onChange={(e) => onUpdateStyle({ letterSpacing: parseFloat(e.target.value) })}
                className="accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-1 mt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold font-sans text-stone-900">Opacity</span>
                <span className="text-xs font-mono font-bold text-emerald-700">{Math.round(currentStyle.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={currentStyle.opacity}
                onChange={(e) => onUpdateStyle({ opacity: parseFloat(e.target.value) })}
                className="accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Text Shadow & Outline Effects */}
          <div className="flex flex-col gap-2 bg-stone-50 p-2 rounded-lg border border-stone-200">
            <span className="text-xs font-semibold font-sans text-stone-900">Shadow & Outline</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  onUpdateStyle({
                    shadowColor: 'rgba(0,0,0,0.4)',
                    shadowBlur: 4,
                    shadowOffsetX: 0,
                    shadowOffsetY: 2,
                  })
                }
                className={`h-7 px-2 text-xs rounded border font-sans transition-colors cursor-pointer ${
                  !!currentStyle.shadowColor
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                    : 'bg-white text-stone-800 border-stone-200 hover:bg-emerald-50'
                }`}
              >
                Shadow
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  onUpdateStyle({
                    shadowColor: undefined,
                    shadowBlur: 0,
                    shadowOffsetX: 0,
                    shadowOffsetY: 0,
                  })
                }
                className="h-7 px-2 text-xs rounded border bg-white text-stone-800 border-stone-200 hover:bg-stone-100 font-sans cursor-pointer"
              >
                None
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-sans text-stone-700 shrink-0">Outline:</span>
              <input
                type="color"
                value={currentStyle.strokeColor || '#000000'}
                onChange={(e) => onUpdateStyle({
                  strokeColor: e.target.value,
                  strokeWidth: currentStyle.strokeWidth || 1.5,
                })}
                className="w-6 h-6 rounded border border-stone-300 cursor-pointer shrink-0"
                title="Outline Color"
              />
              <span className="text-[10px] font-mono font-bold text-stone-700 shrink-0">
                {currentStyle.strokeWidth || 0}px
              </span>
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
                    strokeColor: width > 0 ? (currentStyle.strokeColor || '#000000') : undefined,
                  });
                }}
                className="w-20 accent-emerald-700 cursor-pointer h-1.5 bg-stone-300 rounded-lg shrink-0"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onUpdateStyle({ strokeColor: undefined, strokeWidth: 0 })}
                className="text-[10px] text-rose-700 hover:underline font-sans cursor-pointer shrink-0"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
