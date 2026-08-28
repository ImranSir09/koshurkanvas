import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FontChoice, TextStyleProperties } from '../types';
import { getFontFamilyCSS } from '../lib/fontUtils';
import { toKashmiriNumerals } from '../lib/kashmiriTextTools';
import { KashmiriKeyboard } from './KashmiriKeyboard';
import {
  Check,
  X,
  Copy,
  Trash2,
  ClipboardPaste,
  MoveHorizontal,
  Type,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Minus,
  Plus,
  Sparkles,
  Keyboard,
} from 'lucide-react';

interface UnicodeTextEditorModalProps {
  isOpen: boolean;
  initialText: string;
  initialStyle: TextStyleProperties;
  layerName?: string;
  onSave: (newText: string, newStyle?: Partial<TextStyleProperties>) => void;
  onClose: () => void;
}

const FONTS: { id: FontChoice; label: string; preview: string }[] = [
  { id: 'Noto Nastaliq Urdu', label: 'Noto Nastaliq Urdu', preview: 'کٲشُر لیٚکھُن' },
  { id: 'Gulzar', label: 'Gulzar Nastaliq', preview: 'کٲشُر لیٚکھُن' },
  { id: 'Amiri', label: 'Amiri Naskh', preview: 'کٲشُر لیٚکھُن' },
  { id: 'Noto Sans Arabic', label: 'Noto Sans Arabic', preview: 'کٲشُر لیٚکھُن' },
];

export const UnicodeTextEditorModal: React.FC<UnicodeTextEditorModalProps> = ({
  isOpen,
  initialText,
  initialStyle,
  layerName,
  onSave,
  onClose,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [text, setText] = useState<string>(initialText);
  const [selectedFont, setSelectedFont] = useState<FontChoice>(
    initialStyle.fontFamily || 'Noto Nastaliq Urdu'
  );
  const [fontSize, setFontSize] = useState<number>(initialStyle.fontSize || 32);
  const [direction, setDirection] = useState<'rtl' | 'ltr'>(initialStyle.direction || 'rtl');
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [showFontPicker, setShowFontPicker] = useState<boolean>(false);
  const [showKashmiriKeyboard, setShowKashmiriKeyboard] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Sync state when modal opens with new initialText
  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      setSelectedFont(initialStyle.fontFamily || 'Noto Nastaliq Urdu');
      setFontSize(initialStyle.fontSize || 32);
      setDirection(initialStyle.direction || 'rtl');
      setShowFontPicker(false);

      // Auto-focus standard native textarea to allow Android keyboard to pop up naturally
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          // Place cursor at the end of the text
          const len = initialText.length;
          textareaRef.current.setSelectionRange(len, len);
        }
      }, 120);

      return () => clearTimeout(timer);
    }
  }, [isOpen, initialText, initialStyle]);

  const handleDone = useCallback(() => {
    onSave(text, {
      fontFamily: selectedFont,
      direction,
      fontSize,
      align: direction === 'rtl' ? (initialStyle.align || 'right') : (initialStyle.align || 'left'),
    });
    onClose();
  }, [text, selectedFont, direction, fontSize, initialStyle.align, onSave, onClose]);

  const handleCopyText = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } catch (e) {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  }, [text]);

  const handlePasteText = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setText((prev) => prev + clip);
      }
    } catch (e) {
      textareaRef.current?.focus();
    }
  }, []);

  const handleClearText = useCallback(() => {
    setText('');
    textareaRef.current?.focus();
  }, []);

  // Dedicated Keyboard insertion methods
  const handleInsertCharFromKeyboard = useCallback((char: string) => {
    const el = textareaRef.current;
    if (!el) {
      setText((prev) => prev + char);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.substring(0, start) + char + text.substring(end);
    setText(next);
    const newPos = start + char.length;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }, [text]);

  const handleBackspaceFromKeyboard = useCallback(() => {
    const el = textareaRef.current;
    if (!el) {
      setText((prev) => prev.slice(0, -1));
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    if (start !== end) {
      const next = text.substring(0, start) + text.substring(end);
      setText(next);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start, start);
        }
      }, 0);
    } else if (start > 0) {
      const next = text.substring(0, start - 1) + text.substring(start);
      setText(next);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start - 1, start - 1);
        }
      }, 0);
    }
  }, [text]);

  const handleEnterFromKeyboard = useCallback(() => {
    handleInsertCharFromKeyboard('\n');
  }, [handleInsertCharFromKeyboard]);

  const handleSpaceFromKeyboard = useCallback(() => {
    handleInsertCharFromKeyboard(' ');
  }, [handleInsertCharFromKeyboard]);

  if (!isOpen) return null;

  const fontFamCSS = getFontFamilyCSS(selectedFont);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div
      id="unicode-text-editor-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      dir="rtl"
    >
      {/* Modal Container: Bottom Sheet on Mobile, Centered Dialog on Desktop */}
      <div
        className="w-full sm:max-w-xl max-h-[96vh] flex flex-col bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)',
        }}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-stone-100 border-b border-stone-300 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-800 hover:text-black bg-white hover:bg-stone-200 border border-stone-300 transition-colors cursor-pointer"
              title="Cancel"
              aria-label="Cancel"
            >
              <X size={18} />
            </button>
            <span className="font-sans text-base font-bold text-stone-950">
              {layerName ? layerName : 'Edit Text'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle On-Screen Dedicated Kashmiri Keyboard */}
            <button
              type="button"
              onClick={() => {
                const next = !showKashmiriKeyboard;
                setShowKashmiriKeyboard(next);
                if (!next) {
                  setTimeout(() => {
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                    }
                  }, 50);
                }
              }}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                showKashmiriKeyboard
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-200'
              }`}
              title="Toggle Kashmiri Keyboard"
              aria-label="Toggle Kashmiri Keyboard"
            >
              <Keyboard size={18} />
            </button>

            {/* Primary Done Action Button */}
            <button
              id="btn-done-unicode-editor"
              type="button"
              onClick={handleDone}
              className="w-9 h-9 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white flex items-center justify-center shadow-xs transition-all active:scale-95 cursor-pointer border border-emerald-800"
              title="Done"
              aria-label="Done"
            >
              <Check size={18} />
            </button>
          </div>
        </div>

        {/* Action Toolbar above textarea */}
        <div className="flex items-center justify-between px-3 py-2 bg-stone-50 border-b border-stone-300 text-xs shrink-0 gap-2" dir="ltr">
          {/* Left: Font Picker, Size Stepper & LTR/RTL Control */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Font Picker Trigger */}
            <button
              type="button"
              onClick={() => setShowFontPicker(!showFontPicker)}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                showFontPicker
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-200'
              }`}
              title={`Font: ${selectedFont}`}
              aria-label="Font Choice"
            >
              <Type size={16} />
            </button>

            {/* Size Control Stepper */}
            <div className="flex items-center bg-white border border-stone-300 rounded-xl p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.max(12, s - 2))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-700 hover:text-black hover:bg-stone-100 active:scale-95 transition-all cursor-pointer"
                title="Decrease Font Size"
                aria-label="Decrease Font Size"
              >
                <Minus size={13} />
              </button>

              <span className="px-1.5 font-sans font-bold text-[11px] text-stone-800 tabular-nums select-none min-w-[34px] text-center">
                {fontSize}px
              </span>

              <button
                type="button"
                onClick={() => setFontSize((s) => Math.min(96, s + 2))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-700 hover:text-black hover:bg-stone-100 active:scale-95 transition-all cursor-pointer"
                title="Increase Font Size"
                aria-label="Increase Font Size"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* Direction Toggle (RTL / LTR Segmented) */}
            <div className="flex items-center bg-white border border-stone-300 rounded-xl p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setDirection('rtl')}
                className={`px-2 h-7 rounded-lg flex items-center gap-1 font-sans text-[11px] font-bold transition-all cursor-pointer ${
                  direction === 'rtl'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-700 hover:text-black hover:bg-stone-100'
                }`}
                title="Right to Left (RTL)"
                aria-label="Right to Left"
              >
                <AlignRight size={12} />
                <span>RTL</span>
              </button>

              <button
                type="button"
                onClick={() => setDirection('ltr')}
                className={`px-2 h-7 rounded-lg flex items-center gap-1 font-sans text-[11px] font-bold transition-all cursor-pointer ${
                  direction === 'ltr'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-700 hover:text-black hover:bg-stone-100'
                }`}
                title="Left to Right (LTR)"
                aria-label="Left to Right"
              >
                <span>LTR</span>
                <AlignLeft size={12} />
              </button>
            </div>
          </div>

          {/* Right: Copy / Paste / Clear Actions */}
          <div className="flex items-center gap-1.5 shrink-0" dir="ltr">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyText}
              className="w-8 h-8 rounded-xl bg-white border border-stone-300 text-stone-800 hover:text-black hover:bg-stone-200 flex items-center justify-center transition-all cursor-pointer"
              title="Copy"
              aria-label="Copy"
            >
              {copiedToast ? (
                <Check size={16} className="text-emerald-700" />
              ) : (
                <Copy size={16} />
              )}
            </button>

            {/* Paste Button */}
            <button
              type="button"
              onClick={handlePasteText}
              className="w-8 h-8 rounded-xl bg-white border border-stone-300 text-stone-800 hover:text-black hover:bg-stone-200 flex items-center justify-center transition-all cursor-pointer"
              title="Paste"
              aria-label="Paste"
            >
              <ClipboardPaste size={16} />
            </button>

            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClearText}
              disabled={!text}
              className="w-8 h-8 rounded-xl bg-white border border-stone-300 text-stone-700 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
              title="Clear Text"
              aria-label="Clear Text"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Optional Font Selection Drawer inside Modal */}
        {showFontPicker && (
          <div className="p-3 bg-stone-100 border-b border-stone-200 grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-150 shrink-0">
            {FONTS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setSelectedFont(f.id);
                  setShowFontPicker(false);
                }}
                className={`p-2 rounded-xl text-right border transition-all cursor-pointer ${
                  selectedFont === f.id
                    ? 'bg-emerald-50 border-emerald-500 shadow-2xs ring-1 ring-emerald-500'
                    : 'bg-white border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="text-xs font-semibold text-stone-800 font-sans">{f.label}</div>
                <div
                  className="text-base text-stone-900 mt-1 truncate"
                  style={{ fontFamily: getFontFamilyCSS(f.id) }}
                >
                  {f.preview}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Live Preview Card */}
        <div className="px-4 py-2.5 bg-stone-50/80 border-b border-stone-200/90 text-right shrink-0">
          <div className="text-[10px] text-stone-400 font-sans uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="font-sans text-stone-600 font-medium">Live Nastaliq Preview</span>
            <div className="flex items-center gap-2 font-sans text-stone-500">
              <span>{selectedFont}</span>
              <span>•</span>
              <span className="font-semibold text-emerald-800">{fontSize}px</span>
              <span>•</span>
              <span className="uppercase text-stone-600 font-semibold">{direction}</span>
            </div>
          </div>
          <div
            className="text-xl sm:text-2xl text-stone-900 min-h-[36px] overflow-hidden whitespace-pre-wrap break-words leading-relaxed"
            dir={direction}
            style={{
              fontFamily: fontFamCSS,
              fontSize: `${fontSize}px`,
              textAlign: direction === 'rtl' ? (initialStyle.align || 'right') : (initialStyle.align || 'left'),
              fontWeight: initialStyle.bold ? 'bold' : 'normal',
              fontStyle: initialStyle.italic ? 'italic' : 'normal',
              color: initialStyle.color || '#1c1917',
            }}
          >
            {text || <span className="text-stone-400 italic font-sans text-sm">Enter text to preview...</span>}
          </div>
        </div>

        {/* Native Textarea (Pure Native Android Text Field) */}
        <div className="flex-1 p-4 bg-white min-h-[140px] sm:min-h-[180px] flex flex-col overflow-y-auto">
          <textarea
            ref={textareaRef}
            id="native-unicode-input-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            dir={direction}
            inputMode={showKashmiriKeyboard ? 'none' : 'text'}
            placeholder="ازکیا چھُ تُہنْدس دماغس منْز..."
            className="w-full h-full min-h-[120px] p-2 bg-transparent text-stone-900 caret-emerald-600 font-nastaliq resize-none border-none outline-hidden cursor-text selection:bg-emerald-100 whitespace-pre-wrap break-words leading-[2.4]"
            style={{
              fontFamily: fontFamCSS,
              fontSize: `${Math.max(16, Math.min(48, fontSize))}px`,
              textAlign: direction === 'rtl' ? 'right' : 'left',
            }}
          />
        </div>

        {/* Dedicated On-Screen Kashmiri Keyboard in Modal if toggled */}
        {showKashmiriKeyboard && (
          <div className="shrink-0 animate-in slide-in-from-bottom-2 duration-150 border-t border-stone-300">
            <KashmiriKeyboard
              onInsertChar={handleInsertCharFromKeyboard}
              onBackspace={handleBackspaceFromKeyboard}
              onEnter={handleEnterFromKeyboard}
              onSpace={handleSpaceFromKeyboard}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              onCloseKeyboard={() => {
                setShowKashmiriKeyboard(false);
                setTimeout(() => {
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                  }
                }, 50);
              }}
            />
          </div>
        )}

        {/* Bottom Statistics Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-stone-50 border-t border-stone-200 text-xs text-stone-500 font-sans shrink-0">
          <div className="flex items-center gap-3">
            <span>
              Words: <strong className="text-stone-800 font-sans font-semibold">{wordCount}</strong>
            </span>
            <span className="text-stone-300">•</span>
            <span>
              Characters: <strong className="text-stone-800 font-sans font-semibold">{charCount}</strong>
            </span>
          </div>

          <span className="text-[11px] text-stone-400 font-sans">
            Type with system keyboard or dedicated Kashmiri keyboard
          </span>
        </div>
      </div>
    </div>
  );
};

