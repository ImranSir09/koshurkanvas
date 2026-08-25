import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Globe, Sparkles } from 'lucide-react';

interface VoiceInputButtonProps {
  onInsertVoiceText: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onInsertVoiceText,
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [selectedLang, setSelectedLang] = useState<'ur-PK' | 'hi-IN' | 'ar-SA' | 'en-US'>('ur-PK');
  const [showLangMenu, setShowLangMenu] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = selectedLang;

      recognition.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript;
        if (transcript) {
          onInsertVoiceText(transcript.trim() + ' ');
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [selectedLang, onInsertVoiceText]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = selectedLang;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Error starting speech recognition:', e);
      }
    }
  }, [isListening, selectedLang]);

  return (
    <div className="relative inline-flex items-center">
      {/* Voice Toggle Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={toggleListening}
        className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-sans font-medium border transition-all cursor-pointer ${
          isListening
            ? 'bg-rose-600 text-white border-rose-600 shadow-md animate-pulse'
            : 'bg-white text-stone-700 border-stone-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300'
        }`}
        title={isListening ? 'Stop voice recording' : 'Voice Typing'}
      >
        {isListening ? (
          <>
            <MicOff size={14} className="text-white animate-spin" />
            <span className="font-bold">Listening...</span>
          </>
        ) : (
          <>
            <Mic size={14} className="text-emerald-700" />
            <span>Voice</span>
          </>
        )}
      </button>

      {/* Language Quick Dropdown */}
      <button
        type="button"
        onClick={() => setShowLangMenu(!showLangMenu)}
        className="ml-1 p-1.5 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors text-[10px] font-sans font-medium"
        title="Voice Input Language"
      >
        <Globe size={12} className="inline mr-0.5" />
        {selectedLang.split('-')[0].toUpperCase()}
      </button>

      {showLangMenu && (
        <div
          className="absolute top-9 left-0 bg-white rounded-lg shadow-lg border border-stone-200 py-1 w-36 z-50 animate-in slide-in-from-top-1 text-left"
          dir="ltr"
        >
          <button
            type="button"
            onClick={() => {
              setSelectedLang('ur-PK');
              setShowLangMenu(false);
            }}
            className={`w-full px-3 py-1.5 text-left text-xs font-sans hover:bg-emerald-50 transition-colors ${
              selectedLang === 'ur-PK' ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-stone-700'
            }`}
          >
            Urdu / Kashmiri
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedLang('hi-IN');
              setShowLangMenu(false);
            }}
            className={`w-full px-3 py-1.5 text-left text-xs font-sans hover:bg-emerald-50 transition-colors ${
              selectedLang === 'hi-IN' ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-stone-700'
            }`}
          >
            Hindi
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedLang('ar-SA');
              setShowLangMenu(false);
            }}
            className={`w-full px-3 py-1.5 text-left text-xs font-sans hover:bg-emerald-50 transition-colors ${
              selectedLang === 'ar-SA' ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-stone-700'
            }`}
          >
            Arabic
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedLang('en-US');
              setShowLangMenu(false);
            }}
            className={`w-full px-3 py-1.5 text-left text-xs font-sans hover:bg-emerald-50 transition-colors ${
              selectedLang === 'en-US' ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-stone-700'
            }`}
          >
            English (US)
          </button>
        </div>
      )}
    </div>
  );
};
