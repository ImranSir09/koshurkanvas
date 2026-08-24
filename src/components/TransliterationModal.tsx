import React, { useState } from 'react';
import {
  X,
  Languages,
  Copy,
  Check,
  ArrowRight,
  FileText,
  Volume2,
} from 'lucide-react';
import { transliterateKashmiriToLatin } from '../lib/kashmiriTextTools';

interface TransliterationModalProps {
  isOpen: boolean;
  onClose: () => void;
  kashmiriText: string;
}

export const TransliterationModal: React.FC<TransliterationModalProps> = ({
  isOpen,
  onClose,
  kashmiriText,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const latinText = transliterateKashmiriToLatin(kashmiriText);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(latinText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overscroll-none touch-none">
      <div
        className="w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0rem)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 0rem)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 0rem)',
        }}
        dir="rtl"
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Languages size={16} />
            </div>
            <div>
              <h3 className="font-nastaliq text-base sm:text-lg font-bold text-stone-900 leading-tight">
                رومن / انگریزی رَسمُ الخَط (Latin Transliteration)
              </h3>
              <p className="text-[11px] text-stone-500 font-sans leading-none mt-0.5">
                Convert Kashmiri Nastaliq script to phonetic Latin/English script
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
            title="بَنٛد کٔرِو (Close)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex flex-col gap-3.5 flex-1">
          {/* Source Kashmiri */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-nastaliq font-bold text-stone-700">
              اصل کٲشُر مسودہ (Original Kashmiri):
            </span>
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl font-nastaliq text-base text-stone-900 max-h-32 overflow-y-auto leading-relaxed">
              {kashmiriText || 'مسودس مَنٛز کانہہ تحریر چَھنہٕ۔'}
            </div>
          </div>

          {/* Transliterated Result */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-sans font-bold text-stone-700">
              Phonetic English Transliteration (Roman Kaeshur):
            </span>
            <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl font-sans text-sm text-stone-900 max-h-36 overflow-y-auto leading-relaxed select-all">
              {latinText || 'No text to transliterate.'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-nastaliq cursor-pointer"
          >
            بَنٛد کٔرِو (Close)
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!latinText}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-sans text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Roman Kashmiri</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
