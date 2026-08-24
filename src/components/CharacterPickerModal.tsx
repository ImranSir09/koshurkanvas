import React, { useState } from 'react';
import { KASHMIRI_CHARACTERS_DB } from '../lib/kashmiriData';
import { X, Search, Plus, Copy, Check } from 'lucide-react';
import { copyTextToClipboard } from '../lib/exportEngine';

interface CharacterPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertChar: (char: string) => void;
}

export const CharacterPickerModal: React.FC<CharacterPickerModalProps> = ({
  isOpen,
  onClose,
  onInsertChar,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'specific' | 'vowels' | 'diacritics'>('all');
  const [copiedChar, setCopiedChar] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = KASHMIRI_CHARACTERS_DB.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nameKashmiri.includes(searchTerm) ||
      item.char.includes(searchTerm) ||
      item.sound.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.exampleWord.includes(searchTerm);

    if (!matchesSearch) return false;

    if (selectedFilter === 'specific') return item.isKashmiriSpecific;
    if (selectedFilter === 'vowels') return item.category === 'vowel';
    if (selectedFilter === 'diacritics') return item.category === 'diacritic' || item.category === 'combining';
    return true;
  });

  const handleCopy = (char: string) => {
    copyTextToClipboard(char);
    setCopiedChar(char);
    setTimeout(() => setCopiedChar(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] bg-white border border-stone-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-stone-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-nastaliq text-lg font-bold shrink-0">
              ٲ
            </div>
            <div>
              <h2 className="font-nastaliq text-base sm:text-lg font-bold text-stone-900 leading-tight">
                کٲشُر حُروف دان و لَفْظ رہنُما
              </h2>
              <p className="text-[11px] text-stone-500 font-sans leading-none mt-0.5">
                Kashmiri Characters & Glyphs
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            title="بَنٛد کٔرِو (Close)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 sm:px-5 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="حرف، نام یا لفظ ژھارِو..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg pr-9 pl-3 py-1.5 text-xs font-nastaliq text-stone-900 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-nastaliq shrink-0 transition-all cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              ساری (All)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('specific')}
              className={`px-3 py-1.5 rounded-lg text-xs font-nastaliq shrink-0 transition-all cursor-pointer ${
                selectedFilter === 'specific'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              کٲشِرؠ خاص حُروف
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('vowels')}
              className={`px-3 py-1.5 rounded-lg text-xs font-nastaliq shrink-0 transition-all cursor-pointer ${
                selectedFilter === 'vowels'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              واول (Vowels)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('diacritics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-nastaliq shrink-0 transition-all cursor-pointer ${
                selectedFilter === 'diacritics'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              اِعراب (Diacritics)
            </button>
          </div>
        </div>

        {/* Characters Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-stone-200 p-3 flex items-start justify-between gap-3 shadow-2xs hover:border-emerald-300 transition-all"
            >
              {/* Glyph display */}
              <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-center font-nastaliq text-2xl font-bold shrink-0">
                {item.char}
              </div>

              {/* Character Details */}
              <div className="flex-1 text-right min-w-0">
                <div className="flex items-center gap-1.5 justify-start flex-wrap">
                  <h4 className="font-nastaliq text-sm sm:text-base font-bold text-stone-900 truncate">
                    {item.nameKashmiri}
                  </h4>
                  {item.isKashmiriSpecific && (
                    <span className="text-[9px] font-sans font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded border border-emerald-200 shrink-0">
                      Kashmiri Specific
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-stone-500 font-sans mt-0.5 truncate">
                  {item.name} • <span className="font-mono text-stone-600">{item.unicodeHex}</span>
                </p>

                <div className="mt-1 text-xs text-stone-700 font-nastaliq">
                  <span className="text-stone-400 font-sans text-[10px]">مِثال: </span>
                  <span className="font-bold text-stone-900">{item.exampleWord}</span>
                  <span className="text-stone-500 font-sans text-[10px] mr-1">({item.exampleMeaning})</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onInsertChar(item.char);
                    onClose();
                  }}
                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
                  title="Insert into text"
                >
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(item.char)}
                  className="p-1.5 bg-white hover:bg-emerald-50 text-stone-700 border border-stone-200 hover:border-emerald-300 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  title="Copy character"
                >
                  {copiedChar === item.char ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
