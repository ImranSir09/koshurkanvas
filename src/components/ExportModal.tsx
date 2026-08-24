import React, { useState } from 'react';
import {
  exportDocumentClean,
  shareCanvasDocument,
  exportElement,
  shareCanvasImage,
  copyTextToClipboard,
  downloadTextFile,
  downloadDocFile,
} from '../lib/exportEngine';
import { CanvasAspectRatio, DocumentPaperSize, KashurDocument, SocialCardSize } from '../types';
import {
  X,
  Download,
  Share2,
  Copy,
  FileImage,
  FileText,
  Check,
  Sparkles,
  Loader2,
  Layers,
  Printer,
  Smartphone,
  FileType,
  FileCode,
  Sliders,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetElementId: string;
  projectTitle: string;
  rawUnicodeText: string;
  aspectRatio?: CanvasAspectRatio;
  currentOrientation?: 'portrait' | 'landscape';
  document?: KashurDocument;
}

const PAPER_SIZES: {
  id: DocumentPaperSize;
  labelKashmiri: string;
  shortCode: string;
  dimensions: string;
}[] = [
  { id: 'a4', labelKashmiri: 'اے فور (A4)', shortCode: 'A4', dimensions: '210 × 297 mm' },
  { id: 'a3', labelKashmiri: 'اے تھری (A3)', shortCode: 'A3', dimensions: '297 × 420 mm' },
  { id: 'a5', labelKashmiri: 'اے فائیو (A5)', shortCode: 'A5', dimensions: '148 × 210 mm' },
  { id: 'letter', labelKashmiri: 'لیٹر (Letter)', shortCode: 'Letter', dimensions: '215.9 × 279.4 mm' },
  { id: 'legal', labelKashmiri: 'قانونی (Legal)', shortCode: 'Legal', dimensions: '215.9 × 355.6 mm' },
  { id: 'b5', labelKashmiri: 'بی فائیو (B5)', shortCode: 'B5', dimensions: '176 × 250 mm' },
];

const SOCIAL_SIZES: {
  id: SocialCardSize;
  labelKashmiri: string;
  shortCode: string;
  dimensions: string;
}[] = [
  { id: '1:1', labelKashmiri: 'مورَبَع (1:1)', shortCode: '1:1', dimensions: '1080 × 1080 px' },
  { id: '9:16', labelKashmiri: 'سٹوری (9:16)', shortCode: '9:16', dimensions: '1080 × 1920 px' },
  { id: '16:9', labelKashmiri: 'بینر (16:9)', shortCode: '16:9', dimensions: '1920 × 1080 px' },
  { id: '4:5', labelKashmiri: 'پورٹریٹ (4:5)', shortCode: '4:5', dimensions: '1080 × 1350 px' },
  { id: '3:4', labelKashmiri: 'کلاسک (3:4)', shortCode: '3:4', dimensions: '1200 × 1600 px' },
  { id: 'auto', labelKashmiri: 'آزاد (Auto)', shortCode: 'Auto', dimensions: 'Adaptive Canvas' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  targetElementId,
  projectTitle,
  rawUnicodeText,
  aspectRatio = 'a4',
  currentOrientation = 'portrait',
  document: docProp,
}) => {
  const isDocRatio = ['a3', 'a4', 'a5', 'a6', 'letter', 'legal', 'tabloid', 'b4', 'b5', 'b6'].includes(
    aspectRatio
  );

  // Size Category: 'paper' or 'social'
  const [sizeCategory, setSizeCategory] = useState<'paper' | 'social'>(
    isDocRatio ? 'paper' : 'social'
  );

  const [selectedSize, setSelectedSize] = useState<CanvasAspectRatio>(aspectRatio);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(currentOrientation);
  const [resolutionScale, setResolutionScale] = useState<number>(2.5); // 2.5x HD default
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [copiedTextSuccess, setCopiedTextSuccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const fileName = projectTitle
    ? `kashur-${projectTitle.trim().replace(/\s+/g, '-')}`
    : 'kashur-document';

  const handleExportImageOrPdf = async (
    format: 'png' | 'jpeg' | 'pdf' | 'transparent_png' | 'svg'
  ) => {
    setIsExporting(true);
    setExportingFormat(format);
    setStatusMessage(
      format === 'pdf'
        ? 'پی ڈی ایف دستاویز تیار گژھان چھِ...'
        : format === 'svg'
        ? 'ایس وی جی ویکٹر فائل تیار گژھان چھِ...'
        : 'ہائی ریزولوشن تصویر تیار گژھان چھِ...'
    );

    try {
      if (docProp) {
        // Construct pristine document with requested export options
        const exportDoc: KashurDocument = {
          ...docProp,
          canvasConfig: {
            ...docProp.canvasConfig,
            aspectRatio: selectedSize,
            orientation,
          },
        };
        await exportDocumentClean(exportDoc, {
          fileName,
          format,
          pixelRatio: resolutionScale,
          aspectRatio: selectedSize,
          paperSize: (sizeCategory === 'paper' ? selectedSize : 'a4') as DocumentPaperSize,
          orientation,
        });
      } else {
        const el = document.getElementById(targetElementId);
        if (!el) {
          setStatusMessage('مسودہ کینوس نیبر لٔبِم نہ (Canvas element not found)');
          setIsExporting(false);
          setExportingFormat(null);
          return;
        }
        await exportElement(el, {
          fileName,
          format,
          pixelRatio: resolutionScale,
          aspectRatio: selectedSize,
          paperSize: (sizeCategory === 'paper' ? selectedSize : 'a4') as DocumentPaperSize,
          orientation,
        });
      }

      setStatusMessage('مَحفوظ سپُد (Export Successful)');
      setTimeout(() => {
        setIsExporting(false);
        setExportingFormat(null);
        setStatusMessage(null);
        onClose();
      }, 900);
    } catch (err) {
      console.error(err);
      setStatusMessage('ایکسپورٹ مَنٛز رکاوٹ (Export Failed)');
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  const handleDownloadDoc = () => {
    setIsExporting(true);
    setExportingFormat('doc');
    try {
      downloadDocFile(
        projectTitle,
        rawUnicodeText,
        fileName,
        (sizeCategory === 'paper' ? selectedSize : 'a4') as DocumentPaperSize,
        orientation
      );
      setStatusMessage('ورڈ دستاویز ڈاؤنلوڈ سپُد (Word DOC downloaded)');
      setTimeout(() => {
        setIsExporting(false);
        setExportingFormat(null);
        setStatusMessage(null);
      }, 1000);
    } catch (e) {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  const handleDownloadTxt = () => {
    setIsExporting(true);
    setExportingFormat('txt');
    try {
      downloadTextFile(rawUnicodeText, fileName);
      setStatusMessage('ٹیکسٹ فائل ڈاؤنلوڈ سپٕژ (TXT downloaded)');
      setTimeout(() => {
        setIsExporting(false);
        setExportingFormat(null);
        setStatusMessage(null);
      }, 1000);
    } catch (e) {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  const handleShare = async () => {
    setIsExporting(true);
    setExportingFormat('share');
    setStatusMessage('شیئرنگ خٲطرٕ تصویر تیار گژھان چھِ...');
    try {
      if (docProp) {
        const exportDoc: KashurDocument = {
          ...docProp,
          canvasConfig: {
            ...docProp.canvasConfig,
            aspectRatio: selectedSize,
            orientation,
          },
        };
        await shareCanvasDocument(exportDoc, projectTitle, {
          aspectRatio: selectedSize,
          orientation,
        });
      } else {
        const el = document.getElementById(targetElementId);
        if (el) {
          await shareCanvasImage(el, projectTitle, selectedSize);
        }
      }
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
      setStatusMessage(null);
    }
  };

  const handleCopyText = async () => {
    const success = await copyTextToClipboard(rawUnicodeText);
    if (success) {
      setCopiedTextSuccess(true);
      setTimeout(() => setCopiedTextSuccess(false), 2000);
    }
  };

  // Active size label
  const currentSizeObj =
    sizeCategory === 'paper'
      ? PAPER_SIZES.find((s) => s.id === selectedSize) || PAPER_SIZES[0]
      : SOCIAL_SIZES.find((s) => s.id === selectedSize) || SOCIAL_SIZES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl max-h-[92vh] bg-white border border-stone-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-900"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-stone-300 flex items-center justify-between bg-stone-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs border border-emerald-800">
              <Download size={18} />
            </div>
            <div>
              <h3 className="font-sans text-base sm:text-lg font-bold text-stone-950 leading-tight">
                {projectTitle || 'Kashmiri Canvas'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white border border-stone-300 flex items-center justify-center text-stone-800 hover:text-black hover:bg-stone-200 transition-colors cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Status Message Overlay */}
          {statusMessage && (
            <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-xl text-center text-xs font-nastaliq text-emerald-950 flex items-center justify-center gap-2 animate-in fade-in font-bold">
              {isExporting && <Loader2 size={16} className="animate-spin text-emerald-800" />}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* SECTION 1: TARGET CANVAS SIZE & ORIENTATION */}
          <div className="p-3.5 bg-stone-50 border-2 border-stone-300 rounded-2xl flex flex-col gap-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* Category Toggle: Paper vs Social (Icon Only) */}
              <div className="inline-flex items-center p-1 bg-stone-200 rounded-xl border border-stone-300">
                <button
                  type="button"
                  onClick={() => {
                    setSizeCategory('paper');
                    setSelectedSize('a4');
                  }}
                  className={`w-9 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    sizeCategory === 'paper'
                      ? 'bg-emerald-700 text-white shadow-xs border border-emerald-800'
                      : 'text-stone-700 hover:text-black hover:bg-stone-300'
                  }`}
                  title="Document Paper Size (کاغذ سائز)"
                  aria-label="Document Paper Size"
                >
                  <Printer size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSizeCategory('social');
                    setSelectedSize('1:1');
                  }}
                  className={`w-9 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    sizeCategory === 'social'
                      ? 'bg-emerald-700 text-white shadow-xs border border-emerald-800'
                      : 'text-stone-700 hover:text-black hover:bg-stone-300'
                  }`}
                  title="Social Media Aspect Ratios (سوشل میڈیا سائز)"
                  aria-label="Social Media Aspect Ratios"
                >
                  <Smartphone size={16} />
                </button>
              </div>

              {/* Orientation Switch & Dimension Badge */}
              <div className="flex items-center gap-2">
                {sizeCategory === 'paper' && (
                  <div className="inline-flex items-center p-1 bg-white border border-stone-300 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setOrientation('portrait')}
                      className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                        orientation === 'portrait'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-stone-700 hover:text-black'
                      }`}
                      title="Portrait Orientation"
                    >
                      P
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('landscape')}
                      className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                        orientation === 'landscape'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-stone-700 hover:text-black'
                      }`}
                      title="Landscape Orientation"
                    >
                      L
                    </button>
                  </div>
                )}

                <span className="text-xs font-mono font-bold text-stone-800 bg-white px-2.5 py-1 rounded-xl border border-stone-300">
                  {currentSizeObj.dimensions}
                </span>
              </div>
            </div>

            {/* Direct Size Selector Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {(sizeCategory === 'paper' ? PAPER_SIZES : SOCIAL_SIZES).map((item) => {
                const isSelected = selectedSize === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedSize(item.id)}
                    className={`py-2 px-2 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-800 font-bold shadow-xs'
                        : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-100 hover:border-stone-400'
                    }`}
                  >
                    <span className="font-sans font-bold text-xs leading-none">
                      {item.shortCode}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: ONE-CLICK EXPORT FORMATS */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-nastaliq font-bold text-stone-800 flex items-center gap-1.5">
                <FileType size={14} className="text-emerald-700" />
                <span>دستیاب فارمیٹس (Available Formats — One-Click Export)</span>
              </span>

              {/* Quality Selector */}
              <div className="flex items-center gap-1.5 text-[11px] font-sans text-stone-500">
                <span className="hidden sm:inline text-xs font-nastaliq">کوالٹی:</span>
                <div className="inline-flex items-center p-0.5 bg-stone-100 border border-stone-200 rounded-md text-[10px]">
                  <button
                    type="button"
                    onClick={() => setResolutionScale(2)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      resolutionScale === 2 ? 'bg-white text-emerald-800 font-bold shadow-2xs' : 'text-stone-600'
                    }`}
                  >
                    HD
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolutionScale(3)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      resolutionScale === 3 ? 'bg-white text-emerald-800 font-bold shadow-2xs' : 'text-stone-600'
                    }`}
                  >
                    2K
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolutionScale(4)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      resolutionScale === 4 ? 'bg-white text-emerald-800 font-bold shadow-2xs' : 'text-stone-600'
                    }`}
                  >
                    4K
                  </button>
                </div>
              </div>
            </div>

            {/* Grid of Formats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {/* 1. PDF Document */}
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExportImageOrPdf('pdf')}
                className="p-3 bg-white hover:bg-red-50/50 border border-stone-200 hover:border-red-400 rounded-xl flex items-center justify-between text-right transition-all cursor-pointer active:scale-98 group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-xs font-bold text-stone-900">
                        PDF Document
                      </span>
                      <span className="text-[8.5px] font-sans font-bold bg-red-100 text-red-800 px-1 py-0.2 rounded">
                        Vector
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-sans block mt-0.5">
                      Print-Ready 300 DPI
                    </span>
                  </div>
                </div>
                {exportingFormat === 'pdf' ? (
                  <Loader2 size={15} className="animate-spin text-red-600" />
                ) : (
                  <Download size={15} className="text-stone-400 group-hover:text-red-700 transition-colors" />
                )}
              </button>

              {/* 2. Word DOC */}
              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadDoc}
                className="p-3 bg-white hover:bg-blue-50/50 border border-stone-200 hover:border-blue-400 rounded-xl flex items-center justify-between text-right transition-all cursor-pointer active:scale-98 group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileType size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-xs font-bold text-stone-900">
                        Word DOC
                      </span>
                      <span className="text-[8.5px] font-sans font-bold bg-blue-100 text-blue-800 px-1 py-0.2 rounded">
                        DOCX
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-sans block mt-0.5">
                      Editable RTL Document
                    </span>
                  </div>
                </div>
                {exportingFormat === 'doc' ? (
                  <Loader2 size={15} className="animate-spin text-blue-600" />
                ) : (
                  <Download size={15} className="text-stone-400 group-hover:text-blue-700 transition-colors" />
                )}
              </button>

              {/* 3. PNG HD */}
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExportImageOrPdf('png')}
                className="p-3 bg-white hover:bg-emerald-50/50 border border-stone-200 hover:border-emerald-400 rounded-xl flex items-center justify-between text-right transition-all cursor-pointer active:scale-98 group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileImage size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-xs font-bold text-stone-900">
                        PNG Image
                      </span>
                      <span className="text-[8.5px] font-sans font-bold bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded">
                        HD
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-sans block mt-0.5">
                      High Quality Image
                    </span>
                  </div>
                </div>
                {exportingFormat === 'png' ? (
                  <Loader2 size={15} className="animate-spin text-emerald-600" />
                ) : (
                  <Download size={15} className="text-stone-400 group-hover:text-emerald-700 transition-colors" />
                )}
              </button>

              {/* 4. Transparent PNG */}
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExportImageOrPdf('transparent_png')}
                className="p-3 bg-white hover:bg-purple-50/50 border border-stone-200 hover:border-purple-400 rounded-xl flex items-center justify-between text-right transition-all cursor-pointer active:scale-98 group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-xs font-bold text-stone-900">
                        Transparent PNG
                      </span>
                      <span className="text-[8.5px] font-sans font-bold bg-purple-100 text-purple-800 px-1 py-0.2 rounded">
                        Alpha
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-sans block mt-0.5">
                      Transparent Background
                    </span>
                  </div>
                </div>
                {exportingFormat === 'transparent_png' ? (
                  <Loader2 size={15} className="animate-spin text-purple-600" />
                ) : (
                  <Download size={15} className="text-stone-400 group-hover:text-purple-700 transition-colors" />
                )}
              </button>

              {/* 5. JPG Photo */}
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExportImageOrPdf('jpeg')}
                className="p-3 bg-white hover:bg-amber-50/50 border border-stone-200 hover:border-amber-400 rounded-xl flex items-center justify-between text-right transition-all cursor-pointer active:scale-98 group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileImage size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-xs font-bold text-stone-900">
                        JPEG Photo
                      </span>
                      <span className="text-[8.5px] font-sans font-bold bg-amber-100 text-amber-800 px-1 py-0.2 rounded">
                        Photo
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-sans block mt-0.5">
                      Standard Compressed
                    </span>
                  </div>
                </div>
                {exportingFormat === 'jpeg' ? (
                  <Loader2 size={15} className="animate-spin text-amber-600" />
                ) : (
                  <Download size={15} className="text-stone-400 group-hover:text-amber-700 transition-colors" />
                )}
              </button>

              {/* 6. SVG Vector */}
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExportImageOrPdf('svg')}
                className="p-3 bg-white hover:bg-cyan-50/50 border border-stone-200 hover:border-cyan-400 rounded-xl flex items-center justify-between text-right transition-all cursor-pointer active:scale-98 group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Layers size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-xs font-bold text-stone-900">
                        SVG Vector
                      </span>
                      <span className="text-[8.5px] font-sans font-bold bg-cyan-100 text-cyan-800 px-1 py-0.2 rounded">
                        Vector
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-sans block mt-0.5">
                      Vector Paths & Glyphs
                    </span>
                  </div>
                </div>
                {exportingFormat === 'svg' ? (
                  <Loader2 size={15} className="animate-spin text-cyan-600" />
                ) : (
                  <Download size={15} className="text-stone-400 group-hover:text-cyan-700 transition-colors" />
                )}
              </button>
            </div>
          </div>

          {/* SECTION 3: QUICK UTILITIES (COPY TEXT, TXT FILE, NATIVE SHARE) */}
          <div className="pt-2 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Copy Unicode */}
            <button
              type="button"
              onClick={handleCopyText}
              className="py-2.5 px-3 bg-stone-50 hover:bg-emerald-50 text-stone-800 border border-stone-200 hover:border-emerald-300 rounded-xl font-sans text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-2xs"
            >
              {copiedTextSuccess ? (
                <Check size={15} className="text-emerald-700" />
              ) : (
                <Copy size={15} className="text-stone-600" />
              )}
              <span>
                {copiedTextSuccess ? 'Copied!' : 'Copy Unicode'}
              </span>
            </button>

            {/* Download Plain TXT */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="py-2.5 px-3 bg-stone-50 hover:bg-emerald-50 text-stone-800 border border-stone-200 hover:border-emerald-300 rounded-xl font-sans text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-2xs"
            >
              <FileCode size={15} className="text-stone-600" />
              <span>Text File (.txt)</span>
            </button>

            {/* Native Share */}
            <button
              type="button"
              onClick={handleShare}
              disabled={isExporting}
              className="py-2.5 px-3 bg-stone-50 hover:bg-emerald-50 text-stone-800 border border-stone-200 hover:border-emerald-300 rounded-xl font-sans text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-2xs"
            >
              <Share2 size={15} className="text-emerald-700" />
              <span>Share Design</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[10px] text-stone-500 font-sans shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Noto Nastaliq Urdu v4 Engine</span>
          </div>
          <div className="font-nastaliq text-stone-600">
            عمران مغلو سٹوڈیو
          </div>
        </div>
      </div>
    </div>
  );
};
