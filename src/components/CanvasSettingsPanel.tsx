import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  CanvasAspectRatio,
  CanvasBackgroundConfig,
  DocumentPaperSize,
  SocialCardSize,
} from '../types';
import { ColorGradientPicker } from './ColorGradientPicker';
import {
  Layout,
  Palette,
  Image as ImageIcon,
  Upload,
  Trash2,
  Check,
  RotateCcw,
  Square,
  RectangleVertical,
  RectangleHorizontal,
  Smartphone,
  FileText,
  Maximize2,
  BookOpen,
  Book,
  Newspaper,
  CreditCard,
  Image,
  Layers,
  FileSpreadsheet,
  X,
  Sparkles,
  Sliders,
} from 'lucide-react';

interface CanvasSettingsPanelProps {
  isOpen: boolean;
  canvasConfig: CanvasBackgroundConfig;
  onUpdateCanvasConfig: (updates: Partial<CanvasBackgroundConfig>) => void;
  onClose: () => void;
  snapEnabled?: boolean;
  onToggleSnap?: (enabled: boolean) => void;
  snapSensitivity?: number;
  onChangeSnapSensitivity?: (sensitivity: number) => void;
}

export const DOCUMENT_SIZE_OPTIONS: {
  id: DocumentPaperSize;
  label: string;
  labelEnglish: string;
  dimensionsMm: string;
  icon: React.ReactNode;
  tag: string;
}[] = [
  {
    id: 'a4',
    label: 'A4 Document',
    labelEnglish: 'Standard Document',
    dimensionsMm: '210 × 297 mm',
    icon: <FileText size={15} />,
    tag: 'Standard',
  },
  {
    id: 'a3',
    label: 'A3 Poster',
    labelEnglish: 'Poster & Broadside',
    dimensionsMm: '297 × 420 mm',
    icon: <Maximize2 size={15} />,
    tag: 'Large Print',
  },
  {
    id: 'a5',
    label: 'A5 Booklet',
    labelEnglish: 'Booklet / Diary',
    dimensionsMm: '148 × 210 mm',
    icon: <BookOpen size={15} />,
    tag: 'Diary',
  },
  {
    id: 'letter',
    label: 'US Letter',
    labelEnglish: 'Standard Office Letter',
    dimensionsMm: '215.9 × 279.4 mm',
    icon: <FileText size={15} />,
    tag: 'Office Doc',
  },
  {
    id: 'legal',
    label: 'US Legal',
    labelEnglish: 'Official Legal Document',
    dimensionsMm: '215.9 × 355.6 mm',
    icon: <FileSpreadsheet size={15} />,
    tag: 'Official',
  },
  {
    id: 'tabloid',
    label: 'Tabloid',
    labelEnglish: 'Newspaper Page',
    dimensionsMm: '279.4 × 431.8 mm',
    icon: <Newspaper size={15} />,
    tag: 'Journal',
  },
  {
    id: 'b5',
    label: 'B5 Book',
    labelEnglish: 'Literary Book',
    dimensionsMm: '176 × 250 mm',
    icon: <Book size={15} />,
    tag: 'Book',
  },
  {
    id: 'b4',
    label: 'B4 Journal',
    labelEnglish: 'Academic Journal',
    dimensionsMm: '250 × 353 mm',
    icon: <BookOpen size={15} />,
    tag: 'Edition',
  },
  {
    id: 'a6',
    label: 'A6 Postcard',
    labelEnglish: 'Pocket Postcard',
    dimensionsMm: '105 × 148 mm',
    icon: <CreditCard size={15} />,
    tag: 'Postcard',
  },
];

export const SOCIAL_SIZE_OPTIONS: {
  id: SocialCardSize;
  label: string;
  labelEnglish: string;
  dimensionsPx: string;
  icon: React.ReactNode;
  tag: string;
}[] = [
  {
    id: '1:1',
    label: 'Square (1:1)',
    labelEnglish: 'Instagram & DP Card',
    dimensionsPx: '1080 × 1080 px',
    icon: <Square size={15} />,
    tag: 'Square / DP',
  },
  {
    id: '9:16',
    label: 'Story (9:16)',
    labelEnglish: 'Story & Reels',
    dimensionsPx: '1080 × 1920 px',
    icon: <Smartphone size={15} />,
    tag: 'Story / Status',
  },
  {
    id: '16:9',
    label: 'Banner (16:9)',
    labelEnglish: 'Landscape & Video',
    dimensionsPx: '1920 × 1080 px',
    icon: <RectangleHorizontal size={15} />,
    tag: 'Banner / Video',
  },
  {
    id: '4:5',
    label: 'Portrait (4:5)',
    labelEnglish: 'Portrait Feed Post',
    dimensionsPx: '1080 × 1350 px',
    icon: <RectangleVertical size={15} />,
    tag: 'Feed Post',
  },
  {
    id: '3:4',
    label: 'Classic Frame (3:4)',
    labelEnglish: 'Classic Photo Frame',
    dimensionsPx: '1200 × 1600 px',
    icon: <RectangleVertical size={15} />,
    tag: 'Frame',
  },
  {
    id: '2:3',
    label: 'Standard Photo (2:3)',
    labelEnglish: 'Standard Photo Print',
    dimensionsPx: '1200 × 1800 px',
    icon: <Image size={15} />,
    tag: 'Photo',
  },
  {
    id: 'auto',
    label: 'Adaptive Canvas',
    labelEnglish: 'Continuous Flow',
    dimensionsPx: 'Auto Fit',
    icon: <Maximize2 size={15} />,
    tag: 'Adaptive',
  },
];

export const CANVAS_COLOR_SWATCHES = [
  { color: '#ffffff', name: 'Pure White' },
  { color: '#fbf8ee', name: 'Parchment Ivory' },
  { color: '#f5f5f4', name: 'Stone Gray' },
  { color: '#fef3c7', name: 'Saffron Warm' },
  { color: '#f0fdf4', name: 'Sage Mist' },
  { color: '#f0f9ff', name: 'Glacier Sky' },
  { color: '#fdf2f8', name: 'Kashmir Rose' },
  { color: '#1c1917', name: 'Obsidian Charcoal' },
  { color: '#0f172a', name: 'Twilight Navy' },
  { color: '#064e3b', name: 'Imperial Emerald' },
  { color: '#450a0a', name: 'Deep Maroon' },
];

export const CANVAS_TEXTURE_PRESETS = [
  {
    id: 'gradient-parchment',
    name: 'Parchment Texture',
    value: 'linear-gradient(135deg, #fdfbf7 0%, #f7f3e8 50%, #ede5d0 100%)',
  },
  {
    id: 'gradient-saffron',
    name: 'Saffron Sunset',
    value: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fecaca 100%)',
  },
  {
    id: 'gradient-chinar',
    name: 'Chinar Autumn',
    value: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #d97706 100%)',
  },
  {
    id: 'gradient-emerald',
    name: 'Emerald Cedar',
    value: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
  },
  {
    id: 'gradient-twilight',
    name: 'Dal Twilight',
    value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
  },
  {
    id: 'gradient-slate',
    name: 'Slate Charcoal',
    value: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)',
  },
];

const DEFAULT_PANEL_CONFIG: CanvasBackgroundConfig = {
  aspectRatio: 'a4',
  orientation: 'portrait',
  color: '#ffffff',
  image: undefined,
  imageOpacity: 1,
  overlayOpacity: 0,
};

export const CanvasSettingsPanel: React.FC<CanvasSettingsPanelProps> = ({
  isOpen = false,
  canvasConfig = DEFAULT_PANEL_CONFIG,
  onUpdateCanvasConfig,
  onClose,
  snapEnabled = true,
  onToggleSnap,
  snapSensitivity = 8,
  onChangeSnapSensitivity,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const isDocSize = ['a3', 'a4', 'a5', 'a6', 'letter', 'legal', 'tabloid', 'b4', 'b5', 'b6'].includes(
    canvasConfig?.aspectRatio || ''
  );

  // Section Tab for the panel: 'format' | 'color' | 'media'
  const [activeSection, setActiveSection] = useState<'format' | 'color' | 'media'>('format');

  // Format category: 'document' | 'social'
  const [activeCategoryTab, setActiveCategoryTab] = useState<'document' | 'social'>(
    isDocSize ? 'document' : 'social'
  );

  // Swipe-down gesture state
  const [dragY, setDragY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const dragStartYRef = useRef<number>(0);

  const currentRatio = canvasConfig?.aspectRatio || 'a4';
  const currentOrientation = canvasConfig?.orientation || 'portrait';
  const currentColor = canvasConfig?.color || '#ffffff';
  const currentImage = canvasConfig?.image;
  const currentOpacity = canvasConfig?.imageOpacity ?? 1;
  const currentOverlayOpacity = canvasConfig?.overlayOpacity ?? 0;

  // Sync category if format changes externally
  useEffect(() => {
    if (isDocSize && activeCategoryTab !== 'document') {
      setActiveCategoryTab('document');
    } else if (!isDocSize && activeCategoryTab !== 'social') {
      setActiveCategoryTab('social');
    }
  }, [canvasConfig?.aspectRatio, isDocSize]);

  // Smooth dismiss with slide-down animation
  const handleSmoothClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setDragY(0);
      onClose();
    }, 200);
  }, [onClose]);

  // Touch Gesture Event Handlers for Swiping Down
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartYRef.current = clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - dragStartYRef.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    } else {
      setDragY(deltaY * 0.15);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > 70) {
      handleSmoothClose();
    } else {
      setDragY(0);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          onUpdateCanvasConfig({
            image: dataUrl,
            imageOpacity: 1,
            overlayOpacity: 0.15,
          });
          setActiveSection('media');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetCanvas = () => {
    onUpdateCanvasConfig({
      aspectRatio: 'a4',
      orientation: 'portrait',
      color: '#ffffff',
      image: undefined,
      imageOpacity: 1,
      overlayOpacity: 0,
      overlayColor: '#000000',
    });
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/45 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in overscroll-none touch-none">
      {/* Backdrop tap to close */}
      <div
        className="fixed inset-0"
        onClick={handleSmoothClose}
        aria-label="Close Backdrop"
      />

      {/* Bottom Sheet Modal Container */}
      <div
        ref={sheetRef}
        dir="ltr"
        style={{
          transform: isClosing
            ? 'translateY(100%)'
            : isDragging
            ? `translateY(${Math.max(0, dragY)}px)`
            : 'translateY(0)',
          transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 0rem)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 0rem)',
        }}
        className="relative z-10 w-full max-w-2xl mx-auto bg-white rounded-t-2xl border-t border-x border-stone-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-stone-900 animate-in slide-in-from-bottom duration-250 ease-out select-none"
      >
        {/* Visual Grab Handle Header */}
        <div
          className="w-full pt-2.5 pb-1.5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:bg-stone-50 transition-colors shrink-0 touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
        >
          <div className="w-10 h-1.5 rounded-full bg-stone-300 transition-all hover:bg-stone-400 active:scale-95" />
        </div>

        {/* Panel Header Bar */}
        <div className="px-4 py-2 sm:px-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Layout size={14} />
            </div>
            <div>
              <h3 className="font-sans text-sm sm:text-base font-bold text-stone-900 leading-tight">
                Canvas & Page Format
              </h3>
              <p className="text-[10px] text-stone-500 font-sans leading-none mt-0.5">
                <span className="font-semibold text-emerald-800 uppercase">{currentRatio}</span> • {currentOrientation === 'portrait' ? 'Portrait' : 'Landscape'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetCanvas}
              className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-800 hover:bg-stone-200/60 transition-colors cursor-pointer"
              title="Reset Canvas"
              aria-label="Reset Canvas"
            >
              <RotateCcw size={16} />
            </button>

            <button
              type="button"
              onClick={handleSmoothClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Subtle Navigation Tabs */}
        <div className="px-4 pt-2 pb-1 border-b border-stone-100 bg-white flex items-center justify-between gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 w-full bg-stone-100/90 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveSection('format')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-sans font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeSection === 'format'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Dimensions & Ratio"
            >
              <Layout size={15} className={activeSection === 'format' ? 'text-emerald-700' : 'text-stone-500'} />
              <span>Format</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('color')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-sans font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeSection === 'color'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Background Color & Paper"
            >
              <Palette size={15} className={activeSection === 'color' ? 'text-emerald-700' : 'text-stone-500'} />
              <span>Colors</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('media')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-sans font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeSection === 'media'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Background Image & Overlay"
            >
              <ImageIcon size={15} className={activeSection === 'media' ? 'text-emerald-700' : 'text-stone-500'} />
              <span>Image</span>
            </button>
          </div>
        </div>

        {/* Sheet Content Scrollable Area */}
        <div className="p-4 sm:p-5 flex flex-col gap-3.5 overflow-y-auto custom-scrollbar flex-1">
          {/* SECTION 1: SIZES & RATIO */}
          {activeSection === 'format' && (
            <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
              {/* PRIMARY PRESETS (First 6: Instagram Post, Story, WhatsApp Status, YouTube Thumbnail, A4, Custom) */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-sans font-bold text-stone-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-700" />
                    <span>Popular Design Presets</span>
                  </span>
                  <span className="text-[10px] font-sans text-stone-400">Tap to select</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {/* 1. Instagram Post (1:1) */}
                  <button
                    type="button"
                    onClick={() => onUpdateCanvasConfig({ aspectRatio: '1:1' })}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer active:scale-98 relative shadow-2xs ${
                      currentRatio === '1:1'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                        : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-50 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-md ${currentRatio === '1:1' ? 'bg-white/20 text-white' : 'bg-stone-100 text-emerald-700'}`}>
                          <Square size={15} />
                        </span>
                        <span className="font-sans text-xs sm:text-sm font-bold">Square Post (1:1)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full text-[9.5px] font-sans opacity-85 pt-0.5 border-t border-black/5">
                      <span>Instagram Post</span>
                      <span className="font-mono text-[9px]">1080 × 1080 px</span>
                    </div>
                  </button>

                  {/* 2. Instagram Story (9:16) */}
                  <button
                    type="button"
                    onClick={() => onUpdateCanvasConfig({ aspectRatio: '9:16' })}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer active:scale-98 relative shadow-2xs ${
                      currentRatio === '9:16'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                        : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-50 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-md ${currentRatio === '9:16' ? 'bg-white/20 text-white' : 'bg-stone-100 text-emerald-700'}`}>
                          <Smartphone size={15} />
                        </span>
                        <span className="font-sans text-xs sm:text-sm font-bold">Story / Reel (9:16)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full text-[9.5px] font-sans opacity-85 pt-0.5 border-t border-black/5">
                      <span>Instagram Story</span>
                      <span className="font-mono text-[9px]">1080 × 1920 px</span>
                    </div>
                  </button>

                  {/* 3. WhatsApp Status (9:16) */}
                  <button
                    type="button"
                    onClick={() => onUpdateCanvasConfig({ aspectRatio: '9:16' })}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer active:scale-98 relative shadow-2xs ${
                      currentRatio === '9:16'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                        : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-50 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-md ${currentRatio === '9:16' ? 'bg-white/20 text-white' : 'bg-stone-100 text-emerald-700'}`}>
                          <Smartphone size={15} />
                        </span>
                        <span className="font-sans text-xs sm:text-sm font-bold">Status (9:16)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full text-[9.5px] font-sans opacity-85 pt-0.5 border-t border-black/5">
                      <span>WhatsApp Status</span>
                      <span className="font-mono text-[9px]">1080 × 1920 px</span>
                    </div>
                  </button>

                  {/* 4. YouTube Thumbnail (16:9) */}
                  <button
                    type="button"
                    onClick={() => onUpdateCanvasConfig({ aspectRatio: '16:9' })}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer active:scale-98 relative shadow-2xs ${
                      currentRatio === '16:9'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                        : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-50 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-md ${currentRatio === '16:9' ? 'bg-white/20 text-white' : 'bg-stone-100 text-emerald-700'}`}>
                          <RectangleHorizontal size={15} />
                        </span>
                        <span className="font-sans text-xs sm:text-sm font-bold">Landscape (16:9)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full text-[9.5px] font-sans opacity-85 pt-0.5 border-t border-black/5">
                      <span>YouTube / Banner</span>
                      <span className="font-mono text-[9px]">1920 × 1080 px</span>
                    </div>
                  </button>

                  {/* 5. A4 Document */}
                  <button
                    type="button"
                    onClick={() => onUpdateCanvasConfig({ aspectRatio: 'a4' })}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer active:scale-98 relative shadow-2xs ${
                      currentRatio === 'a4'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                        : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-50 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-md ${currentRatio === 'a4' ? 'bg-white/20 text-white' : 'bg-stone-100 text-emerald-700'}`}>
                          <FileText size={15} />
                        </span>
                        <span className="font-sans text-xs sm:text-sm font-bold">A4 Document</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full text-[9.5px] font-sans opacity-85 pt-0.5 border-t border-black/5">
                      <span>Standard Paper</span>
                      <span className="font-mono text-[9px]">210 × 297 mm</span>
                    </div>
                  </button>

                  {/* 6. Custom Size */}
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCanvasConfig({
                        aspectRatio: 'custom',
                        customWidth: canvasConfig?.customWidth || 1080,
                        customHeight: canvasConfig?.customHeight || 1080,
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer active:scale-98 relative shadow-2xs ${
                      currentRatio === 'custom'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                        : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-50 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-md ${currentRatio === 'custom' ? 'bg-white/20 text-white' : 'bg-stone-100 text-emerald-700'}`}>
                          <Maximize2 size={15} />
                        </span>
                        <span className="font-sans text-xs sm:text-sm font-bold">Custom Dimensions</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full text-[9.5px] font-sans opacity-85 pt-0.5 border-t border-black/5">
                      <span>Custom Dimensions</span>
                      <span className="font-mono text-[9px]">
                        {canvasConfig?.customWidth || 1080} × {canvasConfig?.customHeight || 1080} px
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* CUSTOM DIMENSIONS LARGE CONTROLS (when Custom is selected) */}
              {currentRatio === 'custom' && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-2xl flex flex-col gap-2.5 animate-in fade-in duration-150">
                  <span className="text-xs font-sans font-bold text-emerald-950 flex items-center gap-1.5">
                    <Sliders size={14} className="text-emerald-700" />
                    <span>Custom Width & Height in Pixels</span>
                  </span>

                  <div className="grid grid-cols-2 gap-3" dir="ltr">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-sans font-semibold text-stone-700">
                        Width (px)
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={300}
                          max={4000}
                          step={50}
                          value={canvasConfig?.customWidth || 1080}
                          onChange={(e) =>
                            onUpdateCanvasConfig({
                              customWidth: Math.max(300, Math.min(4000, Number(e.target.value) || 1080)),
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-sm font-bold text-stone-900 outline-none ring-2 ring-emerald-500/20"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-sans font-semibold text-stone-700">
                        Height (px)
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={300}
                          max={4000}
                          step={50}
                          value={canvasConfig?.customHeight || 1080}
                          onChange={(e) =>
                            onUpdateCanvasConfig({
                              customHeight: Math.max(300, Math.min(4000, Number(e.target.value) || 1080)),
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-sm font-bold text-stone-900 outline-none ring-2 ring-emerald-500/20"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MORE PRESETS (Accordion / Switcher for remaining standard sizes) */}
              <div className="border-t border-stone-200/80 pt-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-sans font-bold text-stone-700">
                    More Document & Social Formats
                  </span>

                  {/* Orientation Switcher for Paper */}
                  <div className="inline-flex items-center p-0.5 bg-stone-100 border border-stone-200 rounded-xl text-[11px]">
                    <button
                      type="button"
                      onClick={() => onUpdateCanvasConfig({ orientation: 'portrait' })}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                        currentOrientation === 'portrait'
                          ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                      title="Portrait Orientation"
                    >
                      <RectangleVertical size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateCanvasConfig({ orientation: 'landscape' })}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                        currentOrientation === 'landscape'
                          ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                      title="Landscape Orientation"
                    >
                      <RectangleHorizontal size={15} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DOCUMENT_SIZE_OPTIONS.filter((o) => o.id !== 'a4').map((opt) => {
                    const isActive = currentRatio === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onUpdateCanvasConfig({ aspectRatio: opt.id })}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer active:scale-98 relative shadow-2xs ${
                          isActive
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                            : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-50 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1.5">
                            <span className={`p-1 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-emerald-700'}`}>
                              {opt.icon}
                            </span>
                            <span className="font-sans text-xs font-bold">{opt.label}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between w-full text-[9px] font-sans opacity-85 pt-0.5 border-t border-black/5">
                          <span>{opt.labelEnglish}</span>
                          <span className="font-mono">{opt.dimensionsMm}</span>
                        </div>
                      </button>
                    );
                  })}

                  {SOCIAL_SIZE_OPTIONS.filter((o) => !['1:1', '9:16', '16:9'].includes(o.id)).map((opt) => {
                    const isActive = currentRatio === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onUpdateCanvasConfig({ aspectRatio: opt.id })}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer active:scale-98 relative shadow-2xs ${
                          isActive
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                            : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-50 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1.5">
                            <span className={`p-1 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-emerald-700'}`}>
                              {opt.icon}
                            </span>
                            <span className="font-sans text-xs font-bold">{opt.label}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between w-full text-[9px] font-sans opacity-85 pt-0.5 border-t border-black/5">
                          <span>{opt.labelEnglish}</span>
                          <span className="font-mono">{opt.dimensionsPx}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: COLORS & GRADIENTS */}
          {activeSection === 'color' && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-150">
              <div className="p-3 bg-stone-50/90 border border-stone-200 rounded-xl flex flex-col gap-2">
                <ColorGradientPicker
                  label="Canvas Background"
                  value={canvasConfig.gradient || (canvasConfig.image && (canvasConfig.image.startsWith('linear-gradient') || canvasConfig.image.startsWith('radial-gradient')) ? canvasConfig.image : (canvasConfig.color || '#ffffff'))}
                  gradientValue={canvasConfig.gradient || (canvasConfig.image && (canvasConfig.image.startsWith('linear-gradient') || canvasConfig.image.startsWith('radial-gradient')) ? canvasConfig.image : undefined)}
                  allowNone={false}
                  onChange={(res) => {
                    if (res.type === 'gradient') {
                      onUpdateCanvasConfig({
                        gradient: res.gradient,
                        image: undefined,
                      });
                    } else {
                      onUpdateCanvasConfig({
                        color: res.color || '#ffffff',
                        gradient: undefined,
                        image: undefined,
                      });
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* SECTION 3: IMAGE & OVERLAYS */}
          {activeSection === 'media' && (
            <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
              <div className="p-3.5 bg-stone-50/90 border border-stone-200 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-bold text-stone-900 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-emerald-700" />
                    <span>Custom Background Image</span>
                  </span>

                  {currentImage && (
                    <button
                      type="button"
                      onClick={() => onUpdateCanvasConfig({ image: undefined })}
                      className="px-2 py-1 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-sans flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 size={12} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {/* Upload Button Box */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-stone-300 hover:border-emerald-500 rounded-xl bg-white flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Upload size={18} className="text-emerald-700" />
                  <span className="text-xs font-sans font-bold text-stone-800">
                    Upload Background Image
                  </span>
                  <span className="text-[10px] text-stone-400 font-sans">
                    PNG, JPG, WEBP • Auto Centered & Scaled
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Opacity & Contrast Sliders */}
                {currentImage && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 p-3 bg-white rounded-xl border border-stone-200">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[11px] font-sans text-stone-700">
                        <span>Image Opacity</span>
                        <span className="font-sans font-bold">{Math.round(currentOpacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={currentOpacity}
                        onChange={(e) => onUpdateCanvasConfig({ imageOpacity: parseFloat(e.target.value) })}
                        className="accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[11px] font-sans text-stone-700">
                        <span>Dark Overlay</span>
                        <span className="font-sans font-bold">{Math.round(currentOverlayOpacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.85"
                        step="0.05"
                        value={currentOverlayOpacity}
                        onChange={(e) =>
                          onUpdateCanvasConfig({
                            overlayOpacity: parseFloat(e.target.value),
                            overlayColor: '#000000',
                          })
                        }
                        className="accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Done Action */}
        <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-stone-500 font-sans">
            Changes saved automatically
          </div>

          <button
            type="button"
            onClick={handleSmoothClose}
            className="py-1.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Check size={13} />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
