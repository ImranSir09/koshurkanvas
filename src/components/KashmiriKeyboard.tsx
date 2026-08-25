import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PROFESSIONAL_KASHMIRI_LAYOUTS,
  KeyboardKeyItem,
} from '../lib/kashmiriKeyboardLayouts';
import {
  Delete,
  CornerDownLeft,
  Space,
  Sparkles,
  Layers,
  ChevronDown,
  Volume2,
  VolumeX,
  Languages,
} from 'lucide-react';

interface KashmiriKeyboardProps {
  onInsertChar: (char: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  onSpace: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onCloseKeyboard?: () => void;
}

type KeyboardLayer = 'main' | 'shift' | 'vowels' | 'numbers' | 'phrases';

export const KashmiriKeyboard: React.FC<KashmiriKeyboardProps> = ({
  onInsertChar,
  onBackspace,
  onEnter,
  onSpace,
  soundEnabled = false,
  onToggleSound,
  onCloseKeyboard,
}) => {
  const [activeLayer, setActiveLayer] = useState<KeyboardLayer>('main');
  const [activeLongPressKey, setActiveLongPressKey] = useState<KeyboardKeyItem | null>(null);
  const [longPressPosition, setLongPressPosition] = useState<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  // Audio click synthesizer
  const playClickSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } catch (e) {
      // Audio context might fail on un-interacted DOM
    }
  }, [soundEnabled]);

  const handleKeyPress = (char: string) => {
    playClickSound();
    // Provide light haptic vibration if supported on mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch (e) {
        // ignore
      }
    }
    onInsertChar(char);
    setActiveLongPressKey(null);
  };

  const handleTouchStart = (key: KeyboardKeyItem, e: React.TouchEvent | React.MouseEvent) => {
    if (key.longPress && key.longPress.length > 0) {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      longPressTimerRef.current = window.setTimeout(() => {
        setActiveLongPressKey(key);
        setLongPressPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 8,
        });
      }, 400);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Close long press menu on window click
  useEffect(() => {
    const handleGlobalClick = () => {
      if (activeLongPressKey) {
        setActiveLongPressKey(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [activeLongPressKey]);

  const getLayerRows = (): KeyboardKeyItem[][] => {
    switch (activeLayer) {
      case 'shift':
        return PROFESSIONAL_KASHMIRI_LAYOUTS.shift;
      case 'vowels':
        return PROFESSIONAL_KASHMIRI_LAYOUTS.vowelsAndMarks;
      case 'numbers':
        return PROFESSIONAL_KASHMIRI_LAYOUTS.numbersAndSymbols;
      case 'phrases':
        return PROFESSIONAL_KASHMIRI_LAYOUTS.calligraphyAndPhrases;
      case 'main':
      default:
        return PROFESSIONAL_KASHMIRI_LAYOUTS.main;
    }
  };

  const currentRows = getLayerRows();

  return (
    <div
      id="dedicated-kashmiri-keyboard-container"
      className="relative w-full bg-[#e8e6df] border-t border-stone-300 shadow-2xl z-40 select-none pb-1 flex flex-col font-sans"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.25rem)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 0rem)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 0rem)',
      }}
      dir="rtl"
    >
      {/* 1. TOP TAB RIBBON & QUICK ACTIONS */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#dedbd2] border-b border-stone-300/80 text-xs">
        {/* Remaining Top Option: Phrases Layer Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveLayer((prev) => (prev === 'phrases' ? 'main' : 'phrases'))}
            onMouseDown={(e) => e.preventDefault()}
            className={`h-6.5 px-2 rounded-md font-sans text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs border ${
              activeLayer === 'phrases'
                ? 'bg-emerald-700 text-white border-emerald-800 font-bold'
                : 'bg-stone-200/90 text-stone-800 border-stone-300/90 hover:bg-stone-300/80'
            }`}
            title="Phrases & Calligraphy"
          >
            <Sparkles size={13} className={activeLayer === 'phrases' ? 'text-amber-300' : 'text-emerald-700'} />
          </button>
        </div>

        {/* Tools: Kashida, Sound, Minimize (Icons Only) */}
        <div className="flex items-center gap-1.5 shrink-0" dir="ltr">
          {/* Kashida Tatweel Quick Key */}
          <button
            type="button"
            onClick={() => handleKeyPress('ـ')}
            onMouseDown={(e) => e.preventDefault()}
            className="h-6.5 w-7 rounded-md bg-white text-stone-800 hover:bg-emerald-50 border border-stone-300 font-nastaliq text-xs flex items-center justify-center cursor-pointer shadow-2xs transition-all active:scale-95"
            title="Insert Kashida (ـ)"
          >
            <span className="font-bold text-emerald-700 text-xs leading-none">ـ</span>
          </button>

          {/* Sound Toggle */}
          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              onMouseDown={(e) => e.preventDefault()}
              className={`w-6.5 h-6.5 rounded-md flex items-center justify-center border text-stone-700 cursor-pointer transition-all active:scale-95 shadow-2xs ${
                soundEnabled ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-white border-stone-300'
              }`}
              title={soundEnabled ? 'Sound On' : 'Sound Off'}
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>
          )}

          {/* Close / Hide Keyboard */}
          {onCloseKeyboard && (
            <button
              type="button"
              onClick={onCloseKeyboard}
              onMouseDown={(e) => e.preventDefault()}
              className="w-6.5 h-6.5 rounded-md bg-stone-300 hover:bg-stone-400 active:bg-stone-500 text-stone-700 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs"
              title="Hide Dedicated Keyboard"
            >
              <ChevronDown size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 2. KEYBOARD KEYS GRID */}
      <div className="w-full px-1 pt-1 pb-0.5 flex flex-col gap-1 touch-manipulation">
        {currentRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex items-center justify-center gap-1 w-full">
            {row.map((key, keyIndex) => {
              const isSpecial = key.isKashmiriSpecial;
              return (
                <button
                  key={`${rowIndex}-${keyIndex}-${key.char}`}
                  type="button"
                  onClick={() => handleKeyPress(key.char)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleTouchStart(key, e);
                  }}
                  onMouseUp={handleTouchEnd}
                  onTouchStart={(e) => handleTouchStart(key, e)}
                  onTouchEnd={handleTouchEnd}
                  className={`relative flex-1 min-w-0 h-10 sm:h-11 rounded-md flex items-center justify-center font-nastaliq text-base sm:text-lg transition-all select-none active:scale-90 active:bg-emerald-100 cursor-pointer shadow-xs border ${
                    isSpecial
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300/80 font-bold'
                      : 'bg-white hover:bg-stone-50 text-stone-900 border-stone-300'
                  }`}
                  style={{
                    lineHeight: '1',
                  }}
                  title={key.label || key.char}
                >
                  <span>{key.displayChar || key.char}</span>

                  {/* Long-press dot indicator */}
                  {key.longPress && key.longPress.length > 0 && (
                    <span className="absolute top-1 left-1 w-1 h-1 rounded-full bg-stone-400/60" />
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* 3. FUNCTION KEYS BOTTOM ROW */}
        <div className="flex items-center justify-center gap-1.5 w-full pt-0.5">
          {/* Vowels / Layer Quick Switch */}
          <button
            type="button"
            onClick={() => setActiveLayer((prev) => (prev === 'vowels' ? 'main' : 'vowels'))}
            onMouseDown={(e) => e.preventDefault()}
            className={`w-11 sm:w-13 h-10 sm:h-11 rounded-md flex items-center justify-center font-nastaliq text-[11px] transition-all cursor-pointer shadow-xs border ${
              activeLayer === 'vowels'
                ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                : 'bg-[#cfccc4] text-stone-800 border-stone-300 hover:bg-[#c5c2ba]'
            }`}
            title="Vowels / Aerab Layer (اِعراب)"
          >
            <span>{activeLayer === 'vowels' ? 'حُرُوف' : 'اِعراب'}</span>
          </button>

          {/* Full Stop / Kashmiri Poornaviram */}
          <button
            type="button"
            onClick={() => handleKeyPress('۔')}
            onMouseDown={(e) => e.preventDefault()}
            className="w-9 sm:w-11 h-10 sm:h-11 rounded-md bg-white border border-stone-300 font-nastaliq text-sm text-stone-900 flex items-center justify-center hover:bg-stone-50 active:scale-95 shadow-xs cursor-pointer"
            title="Kashmiri Full Stop (۔)"
          >
            ۔
          </button>

          {/* Symbol / Numbers Quick Switch (Replaces Comma) */}
          <button
            type="button"
            onClick={() => setActiveLayer((prev) => (prev === 'numbers' ? 'main' : 'numbers'))}
            onMouseDown={(e) => e.preventDefault()}
            className={`w-9 sm:w-11 h-10 sm:h-11 rounded-md flex items-center justify-center font-nastaliq text-[11px] transition-all cursor-pointer shadow-xs border ${
              activeLayer === 'numbers'
                ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                : 'bg-[#cfccc4] text-stone-800 border-stone-300 hover:bg-[#c5c2ba]'
            }`}
            title="Symbols & Numbers (۱۲۳)"
          >
            <span>{activeLayer === 'numbers' ? 'حُرُوف' : '۱۲۳'}</span>
          </button>

          {/* Space Bar */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onSpace();
            }}
            onMouseDown={(e) => e.preventDefault()}
            className="flex-1 h-10 sm:h-11 rounded-md bg-white hover:bg-stone-50 active:bg-emerald-50 border border-stone-300 text-stone-600 flex items-center justify-center gap-1 shadow-xs transition-all active:scale-98 cursor-pointer"
            title="Space"
          >
            <Space size={18} />
          </button>

          {/* Backspace */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onBackspace();
            }}
            onMouseDown={(e) => e.preventDefault()}
            className="w-11 sm:w-13 h-10 sm:h-11 rounded-md bg-[#cfccc4] hover:bg-[#c5c2ba] active:bg-rose-100 text-stone-800 border border-stone-300 flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
            title="Backspace (حذف)"
          >
            <Delete size={16} />
          </button>

          {/* Enter / Return */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onEnter();
            }}
            onMouseDown={(e) => e.preventDefault()}
            className="w-11 sm:w-13 h-10 sm:h-11 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border border-emerald-700 flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
            title="Enter (اگلی سطر)"
          >
            <CornerDownLeft size={16} />
          </button>
        </div>
      </div>

      {/* 4. LONG PRESS FLOATING POPUP */}
      {activeLongPressKey && activeLongPressKey.longPress && longPressPosition && (
        <div
          className="fixed z-50 bg-stone-900/95 text-white p-1.5 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-1.5 -translate-x-1/2 -translate-y-full animate-in zoom-in-90 duration-100"
          style={{
            left: `${longPressPosition.x}px`,
            top: `${longPressPosition.y}px`,
          }}
          dir="rtl"
        >
          {activeLongPressKey.longPress.map((variant) => (
            <button
              key={variant}
              type="button"
              onClick={() => handleKeyPress(variant)}
              className="w-10 h-10 rounded-lg bg-stone-800 hover:bg-emerald-600 text-white font-nastaliq text-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              {variant}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
