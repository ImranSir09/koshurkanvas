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
  { id: 'Noto Nastaliq Urdu', label: 'نوٹو نستعلیق (Nastaliq)', preview: 'کٲشُر لیٚکھُن' },
  { id: 'Gulzar', label: 'گُلزار نستعلیق (Gulzar)', preview: 'کٲشُر لیٚکھُن' },
  { id: 'Amiri', label: 'امیری نسخ (Amiri Naskh)', preview: 'کٲشُر لیٚکھُن' },
  { id: 'Noto Sans Arabic', label: 'نوٹو سنز عربک (Sans Arabic)', preview: 'کٲشُر لیٚکھُن' },
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
    });
    onClose();
  }, [text, selectedFont, direction, onSave, onClose]);

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
              title="Cancel (بند کٔرِو)"
              aria-label="Cancel"
            >
              <X size={18} />
            </button>
            <span className="font-nastaliq text-base font-bold text-stone-950">
              {layerName ? layerName : 'متن لؠکھِو'}
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
              title="Toggle Kashmiri Keyboard (کٲشُر کیبورڈ)"
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
              title="Done (ہۆو)"
              aria-label="Done"
            >
              <Check size={18} />
            </button>
          </div>
        </div>

        {/* Action Toolbar above textarea */}
        <div className="flex items-center justify-between px-3 py-2 bg-stone-50 border-b border-stone-300 text-xs shrink-0">
          <div className="flex items-center gap-1.5" dir="ltr">
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

            {/* Direction Toggle */}
            <button
              type="button"
              onClick={() => setDirection((prev) => (prev === 'rtl' ? 'ltr' : 'rtl'))}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                direction === 'rtl'
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-500'
                  : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-200'
              }`}
              title={direction === 'rtl' ? 'Right-to-Left (RTL)' : 'Left-to-Right (LTR)'}
              aria-label="Text Direction"
            >
              <MoveHorizontal size={16} />
            </button>
          </div>

          <div className="flex items-center gap-1.5" dir="ltr">
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
            <span className="font-nastaliq text-stone-600">کینوس پیش نظارہ (Live Nastaliq Preview)</span>
            <span className="font-sans text-stone-500">{selectedFont}</span>
          </div>
          <div
            className="text-xl sm:text-2xl text-stone-900 min-h-[36px] overflow-hidden whitespace-pre-wrap break-words leading-relaxed"
            dir={direction}
            style={{
              fontFamily: fontFamCSS,
              textAlign: initialStyle.align || 'center',
              fontWeight: initialStyle.bold ? 'bold' : 'normal',
              fontStyle: initialStyle.italic ? 'italic' : 'normal',
              color: initialStyle.color || '#1c1917',
            }}
          >
            {text || <span className="text-stone-400 italic">متن درج کٔرِو... (Live preview)</span>}
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
            placeholder="ٲسۍ ہٚچھِو تہٕ کٲشُر لؠکھِو... (Type Kashmiri Unicode using keyboard)"
            className="w-full h-full min-h-[120px] p-2 bg-transparent text-stone-900 caret-emerald-600 text-lg sm:text-xl font-nastaliq resize-none border-none outline-hidden cursor-text selection:bg-emerald-100 whitespace-pre-wrap break-words leading-[2.4]"
            style={{
              fontFamily: fontFamCSS,
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
              الفاظ: <strong className="text-stone-800 font-nastaliq">{toKashmiriNumerals(wordCount)}</strong>
            </span>
            <span className="text-stone-300">•</span>
            <span>
              حُرُوف: <strong className="text-stone-800 font-nastaliq">{toKashmiriNumerals(charCount)}</strong>
            </span>
          </div>

          <span className="text-[11px] text-stone-400 font-nastaliq">
            تۄہۍ ہؠکِو اینڈرائڈ کیبورڈ یا کٲشُر کیبورڈ دۄشوے اِستعمال کٔرِتھ
          </span>
        </div>
      </div>
    </div>
  );
};

