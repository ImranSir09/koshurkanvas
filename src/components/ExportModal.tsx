import React, { useState, useRef } from 'react';
import {
  exportDocumentClean,
  copyTextToClipboard,
  downloadTextFile,
  downloadDocFile,
  ExportStageName,
  getExportResolutionDimensions,
} from '../lib/exportEngine';
import { CanvasAspectRatio, DocumentPaperSize, KashurDocument } from '../types/index';
import { DOCUMENT_SIZE_OPTIONS, SOCIAL_SIZE_OPTIONS } from './CanvasSettingsPanel';
import { ExportProgressPanel } from './ExportProgressPanel';
import {
  X,
  Download,
  Share2,
  Copy,
  FileImage,
  FileText,
  Check,
  Sparkles,
  Layers,
  Printer,
  Smartphone,
  FileType,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
  Maximize2,
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

const PAPER_SIZES = DOCUMENT_SIZE_OPTIONS.map((opt) => ({
  id: opt.id,
  label: opt.label,
  shortCode: opt.id.toUpperCase(),
  dimensionsMm: opt.dimensionsMm,
  tag: opt.tag,
}));

export type ExportFormatType =
  | 'png'
  | 'jpeg'
  | 'transparent_png'
  | 'svg'
  | 'pdf'
  | 'doc'
  | 'txt'
  | 'share';

export type ExportModeTab = 'visual' | 'document';

export interface ActiveExportSession {
  format: ExportFormatType;
  fileName: string;
  formatLabel: string;
  dimensionsStr: string;
  stage: ExportStageName | 'Failed' | 'Cancelled';
  percent: number;
  sizeBytes: number | null;
  errorMessage: string | null;
  savedUri: string | null;
  savedPath: string | null;
  exportedDataUrl: string | null;
}

export function getFormattedExportFileName(
  title: string,
  format: ExportFormatType
): string {
  const clean = title ? title.trim().replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_') : 'Design_001';
  const base = clean.toLowerCase().startsWith('kashur') || clean.toLowerCase().startsWith('koshur')
    ? clean
    : `KoshurKanvas_${clean}`;

  switch (format) {
    case 'png':
      return `${base}.png`;
    case 'jpeg':
      return `${base}.jpg`;
    case 'transparent_png':
      return `${base}_transparent.png`;
    case 'svg':
      return `${base}.svg`;
    case 'pdf':
      return `${base}.pdf`;
    case 'doc':
      return `${base}.doc`;
    case 'txt':
      return `${base}.txt`;
    case 'share':
      return `${base}.png`;
    default:
      return `${base}.png`;
  }
}

export function getFormattedExportDimensions(
  format: ExportFormatType,
  aspectRatio: CanvasAspectRatio = 'a4',
  orientation: 'portrait' | 'landscape' = 'portrait'
): string {
  if (format === 'txt') return 'Plain Text Document';
  if (format === 'doc') return 'Word Document (RTL)';

  const dims = getExportResolutionDimensions(aspectRatio, orientation);
  if (format === 'pdf') {
    return `${aspectRatio.toUpperCase()} (${dims.width} × ${dims.height} px)`;
  }
  return `${dims.width} × ${dims.height} px`;
}

export function getFormatLabel(format: ExportFormatType): string {
  switch (format) {
    case 'png':
      return 'PNG';
    case 'jpeg':
      return 'JPG';
    case 'transparent_png':
      return 'Transparent PNG';
    case 'svg':
      return 'SVG';
    case 'pdf':
      return 'PDF';
    case 'doc':
      return 'DOC';
    case 'txt':
      return 'TXT';
    case 'share':
      return 'PNG (Share)';
    default:
      return 'PNG';
  }
}

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

  // Default mode tab based on current workspace canvas
  const [activeTab, setActiveTab] = useState<ExportModeTab>(
    isDocRatio ? 'document' : 'visual'
  );

  // Visual Graphic Quality scale (1x, 2x HD, 3x 2K, 4x 4K Ultra HD)
  const [resolutionScale, setResolutionScale] = useState<number>(2.5);

  // Document/Print configuration (Only applicable in Document mode)
  const [selectedPaperSize, setSelectedPaperSize] = useState<DocumentPaperSize>(
    isDocRatio ? (aspectRatio as DocumentPaperSize) : 'a4'
  );
  const [docOrientation, setDocOrientation] = useState<'portrait' | 'landscape'>(
    currentOrientation
  );

  const [copiedTextSuccess, setCopiedTextSuccess] = useState<boolean>(false);

  // Active Export Session State
  const [activeSession, setActiveSession] = useState<ActiveExportSession | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  if (!isOpen) return null;

  // Active canvas details in visual mode
  const activeCanvasOption =
    SOCIAL_SIZE_OPTIONS.find((s) => s.id === (aspectRatio as any)) ||
    DOCUMENT_SIZE_OPTIONS.find((d) => d.id === (aspectRatio as any));
  const activeCanvasLabel = activeCanvasOption?.label || `${aspectRatio.toUpperCase()}`;
  const activeCanvasDims = getExportResolutionDimensions(
    aspectRatio as CanvasAspectRatio,
    (currentOrientation === 'landscape' ? 'landscape' : 'portrait')
  );

  const handleStartExport = async (format: ExportFormatType) => {
    // Abort previous if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const signal = abortController.signal;

    // Visual graphics use the active canvas without re-sizing
    // Document exports use the configured paper size and orientation
    const isDocumentFormat = format === 'pdf' || format === 'doc' || format === 'txt';
    const targetRatio: CanvasAspectRatio = isDocumentFormat ? selectedPaperSize : aspectRatio;
    const targetOrientation = isDocumentFormat ? docOrientation : currentOrientation;

    const fileName = getFormattedExportFileName(projectTitle, format);
    const formatLabel = getFormatLabel(format);
    const dimensionsStr = getFormattedExportDimensions(format, targetRatio, targetOrientation);

    const session: ActiveExportSession = {
      format,
      fileName,
      formatLabel,
      dimensionsStr,
      stage: 'Preparing',
      percent: 0,
      sizeBytes: null,
      errorMessage: null,
      savedUri: null,
      savedPath: null,
      exportedDataUrl: null,
    };

    setActiveSession(session);

    const updateSession = (patch: Partial<ActiveExportSession>) => {
      setActiveSession((prev) => (prev ? { ...prev, ...patch } : null));
    };

    const handleProgress = (
      stage: ExportStageName,
      percent: number,
      details?: { sizeBytes?: number; dataUrl?: string; uri?: string; path?: string }
    ) => {
      updateSession({
        stage,
        percent,
        ...(details?.sizeBytes !== undefined ? { sizeBytes: details.sizeBytes } : {}),
        ...(details?.dataUrl ? { exportedDataUrl: details.dataUrl } : {}),
        ...(details?.uri ? { savedUri: details.uri } : {}),
        ...(details?.path ? { savedPath: details.path } : {}),
      });
    };

    try {
      if (format === 'txt') {
        const textContent = rawUnicodeText || docProp?.content || '';
        const res = await downloadTextFile(textContent, fileName);
        if (signal.aborted) return;
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const sizeBytes = blob.size;

        if (!res || res.success === false) {
          throw new Error(res?.message || 'Failed to save Text file');
        }

        handleProgress('Complete', 100, { sizeBytes, uri: res.uri, path: res.path });
      } else if (format === 'doc') {
        const effectiveDocOpacity = docProp?.defaultStyle?.opacity ?? 1;
        const res = await downloadDocFile(
          projectTitle,
          rawUnicodeText,
          fileName,
          selectedPaperSize,
          docOrientation,
          effectiveDocOpacity,
          docProp
        );
        if (signal.aborted) return;

        if (!res || res.success === false) {
          throw new Error(res?.message || 'Failed to save Word DOC');
        }

        const sizeBytes = new TextEncoder().encode(rawUnicodeText).length + 2048;
        handleProgress('Complete', 100, { sizeBytes, uri: res.uri, path: res.path });
      } else {
        const exportDoc: KashurDocument = docProp
          ? {
              ...docProp,
              canvasConfig: {
                ...docProp.canvasConfig,
                aspectRatio: targetRatio,
                orientation: targetOrientation,
              },
            }
          : {
              id: 'temp',
              title: projectTitle,
              content: rawUnicodeText,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              canvasConfig: {
                ...docProp?.canvasConfig,
                aspectRatio: targetRatio,
                orientation: targetOrientation,
                color: '#ffffff',
              },
              textLayers: [],
            };

        const exportedDataUrl = await exportDocumentClean(exportDoc, {
          fileName: fileName.replace(/\.[^/.]+$/, ''),
          format,
          pixelRatio: resolutionScale,
          aspectRatio: targetRatio,
          paperSize: selectedPaperSize,
          orientation: targetOrientation,
          onProgress: handleProgress,
          signal,
        });

        if (signal.aborted) return;

        let sizeBytes: number | undefined;
        if (exportedDataUrl && exportedDataUrl.startsWith('data:')) {
          const base64Len = exportedDataUrl.split(',')[1]?.length || 0;
          sizeBytes = Math.round(base64Len * 0.75);
        }

        handleProgress('Complete', 100, {
          sizeBytes,
          dataUrl: exportedDataUrl,
        });
      }
    } catch (err: any) {
      if (signal.aborted) return;
      console.error('Export failed:', err);
      updateSession({
        stage: 'Failed',
        errorMessage: err?.message || 'Export failed. Please verify storage permissions and try again.',
      });
    }
  };

  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setActiveSession(null);
  };

  const handleRetryExport = () => {
    if (activeSession) {
      handleStartExport(activeSession.format);
    }
  };

  const handleDoneExport = () => {
    setActiveSession(null);
    onClose();
  };

  const handleCopyText = async () => {
    const success = await copyTextToClipboard(rawUnicodeText);
    if (success) {
      setCopiedTextSuccess(true);
      setTimeout(() => setCopiedTextSuccess(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150 overscroll-none touch-none">
      {/* Active Export Progress Modal Panel */}
      {activeSession ? (
        <ExportProgressPanel
          fileName={activeSession.fileName}
          formatLabel={activeSession.formatLabel}
          dimensionsStr={activeSession.dimensionsStr}
          stage={activeSession.stage}
          percent={activeSession.percent}
          sizeBytes={activeSession.sizeBytes}
          errorMessage={activeSession.errorMessage}
          savedUri={activeSession.savedUri}
          savedPath={activeSession.savedPath}
          exportedDataUrl={activeSession.exportedDataUrl}
          onCancel={handleCancelExport}
          onRetry={handleRetryExport}
          onDone={handleDoneExport}
        />
      ) : (
        /* Format Selection Options Modal */
        <div
          className="w-full max-w-2xl max-h-[92vh] bg-white border border-stone-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-900"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0rem)',
            paddingLeft: 'max(env(safe-area-inset-left, 0px), 0rem)',
            paddingRight: 'max(env(safe-area-inset-right, 0px), 0rem)',
          }}
          dir="ltr"
        >
          {/* Modal Header */}
          <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-stone-300 flex items-center justify-between bg-stone-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs border border-emerald-800">
                <Download size={18} />
              </div>
              <div>
                <h3 className="font-sans text-base sm:text-lg font-bold text-stone-950 leading-tight">
                  {projectTitle || 'Export Document'}
                </h3>
                <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                  Choose your export format
                </p>
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

          {/* DUAL MODE NAVIGATION TABS */}
          <div className="px-4 pt-3 sm:px-5 border-b border-stone-200 bg-stone-50 flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('visual')}
              className={`flex-1 pb-2.5 pt-2 px-3 rounded-t-xl font-sans text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border-b-2 ${
                activeTab === 'visual'
                  ? 'text-emerald-800 border-emerald-700 bg-white shadow-2xs'
                  : 'text-stone-500 border-transparent hover:text-stone-800 hover:bg-stone-100'
              }`}
            >
              <ImageIcon size={16} className={activeTab === 'visual' ? 'text-emerald-700' : 'text-stone-400'} />
              <span>Visual Graphic (Active Canvas)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('document')}
              className={`flex-1 pb-2.5 pt-2 px-3 rounded-t-xl font-sans text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border-b-2 ${
                activeTab === 'document'
                  ? 'text-emerald-800 border-emerald-700 bg-white shadow-2xs'
                  : 'text-stone-500 border-transparent hover:text-stone-800 hover:bg-stone-100'
              }`}
            >
              <FileText size={16} className={activeTab === 'document' ? 'text-emerald-700' : 'text-stone-400'} />
              <span>Document / Print</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
            {/* ========================================================================= */}
            {/* TAB 1: VISUAL GRAPHIC (LOCKED TO ACTIVE CANVAS RATIO)                     */}
            {/* ========================================================================= */}
            {activeTab === 'visual' && (
              <div className="flex flex-col gap-4">
                {/* Active Canvas Badge banner */}
                <div className="p-3 bg-stone-50 border border-stone-300 rounded-xl flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-300">
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-sans font-bold text-stone-900 block">
                        Current Canvas: {activeCanvasLabel}
                      </span>
                      <span className="text-[11px] text-stone-500 font-sans">
                        Exports pixel-perfect artwork with no re-layout distortion
                      </span>
                    </div>
                  </div>

                  {/* Quality/Resolution Multiplier */}
                  <div className="flex items-center gap-1.5 text-[11px] font-sans text-stone-600 bg-white px-2.5 py-1.5 rounded-lg border border-stone-200">
                    <span className="text-xs font-sans font-semibold">Scale:</span>
                    <div className="inline-flex items-center p-0.5 bg-stone-100 border border-stone-200 rounded-md text-[10px]">
                      <button
                        type="button"
                        onClick={() => setResolutionScale(1.5)}
                        className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                          resolutionScale === 1.5
                            ? 'bg-white text-emerald-800 font-bold shadow-2xs border border-emerald-300'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                        title="Standard 1.5x"
                      >
                        1.5×
                      </button>
                      <button
                        type="button"
                        onClick={() => setResolutionScale(2.5)}
                        className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                          resolutionScale === 2.5
                            ? 'bg-white text-emerald-800 font-bold shadow-2xs border border-emerald-300'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                        title="High Definition 2.5x"
                      >
                        HD (2.5×)
                      </button>
                      <button
                        type="button"
                        onClick={() => setResolutionScale(4)}
                        className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                          resolutionScale === 4
                            ? 'bg-white text-emerald-800 font-bold shadow-2xs border border-emerald-300'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                        title="Ultra HD 4x"
                      >
                        4K (4×)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Visual Graphics Formats Grid */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-sans font-bold text-stone-800 flex items-center gap-1.5">
                    <FileType size={14} className="text-emerald-700" />
                    <span>Select Image Format</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* 1. PNG HD */}
                    <button
                      type="button"
                      onClick={() => handleStartExport('png')}
                      className="p-3 bg-white hover:bg-emerald-50/50 border border-stone-200 hover:border-emerald-400 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer active:scale-98 group shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <FileImage size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-sans text-xs font-bold text-stone-900">
                              PNG Image
                            </span>
                            <span className="text-[8.5px] font-sans font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                              Crisp HD
                            </span>
                          </div>
                          <span className="text-[10.5px] text-stone-500 font-sans block mt-0.5">
                            Lossless raster calligraphy & graphics
                          </span>
                        </div>
                      </div>
                      <Download size={16} className="text-stone-400 group-hover:text-emerald-700 transition-colors" />
                    </button>

                    {/* 2. Transparent PNG */}
                    <button
                      type="button"
                      onClick={() => handleStartExport('transparent_png')}
                      className="p-3 bg-white hover:bg-purple-50/50 border border-stone-200 hover:border-purple-400 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer active:scale-98 group shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-sans text-xs font-bold text-stone-900">
                              Transparent PNG
                            </span>
                            <span className="text-[8.5px] font-sans font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                              Sticker / Overlay
                            </span>
                          </div>
                          <span className="text-[10.5px] text-stone-500 font-sans block mt-0.5">
                            Alpha cutout background for overlays
                          </span>
                        </div>
                      </div>
                      <Download size={16} className="text-stone-400 group-hover:text-purple-700 transition-colors" />
                    </button>

                    {/* 3. JPG Photo */}
                    <button
                      type="button"
                      onClick={() => handleStartExport('jpeg')}
                      className="p-3 bg-white hover:bg-amber-50/50 border border-stone-200 hover:border-amber-400 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer active:scale-98 group shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <FileImage size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-sans text-xs font-bold text-stone-900">
                              JPEG Photo
                            </span>
                            <span className="text-[8.5px] font-sans font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                              Compact
                            </span>
                          </div>
                          <span className="text-[10.5px] text-stone-500 font-sans block mt-0.5">
                            Smaller file size for quick sharing
                          </span>
                        </div>
                      </div>
                      <Download size={16} className="text-stone-400 group-hover:text-amber-700 transition-colors" />
                    </button>

                    {/* 4. SVG Vector */}
                    <button
                      type="button"
                      onClick={() => handleStartExport('svg')}
                      className="p-3 bg-white hover:bg-cyan-50/50 border border-stone-200 hover:border-cyan-400 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer active:scale-98 group shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Layers size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-sans text-xs font-bold text-stone-900">
                              SVG Vector
                            </span>
                            <span className="text-[8.5px] font-sans font-bold bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded">
                              Scalable
                            </span>
                          </div>
                          <span className="text-[10.5px] text-stone-500 font-sans block mt-0.5">
                            Infinite scalability with embedded fonts
                          </span>
                        </div>
                      </div>
                      <Download size={16} className="text-stone-400 group-hover:text-cyan-700 transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: DOCUMENT & PRINT (WITH PAPER SIZE SELECTION)                       */}
            {/* ========================================================================= */}
            {activeTab === 'document' && (
              <div className="flex flex-col gap-4">
                {/* Paper Size & Orientation Selector */}
                <div className="p-3.5 bg-stone-50 border-2 border-stone-300 rounded-2xl flex flex-col gap-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <Printer size={16} className="text-emerald-700" />
                      <span className="text-xs font-sans font-bold text-stone-900">
                        Print Paper Size
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Orientation Switch */}
                      <div className="inline-flex items-center p-0.5 bg-white border border-stone-300 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setDocOrientation('portrait')}
                          className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold transition-all cursor-pointer ${
                            docOrientation === 'portrait'
                              ? 'bg-emerald-700 text-white shadow-2xs'
                              : 'text-stone-700 hover:text-black'
                          }`}
                          title="Portrait"
                        >
                          Portrait
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocOrientation('landscape')}
                          className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold transition-all cursor-pointer ${
                            docOrientation === 'landscape'
                              ? 'bg-emerald-700 text-white shadow-2xs'
                              : 'text-stone-700 hover:text-black'
                          }`}
                          title="Landscape"
                        >
                          Landscape
                        </button>
                      </div>

                      <span className="text-[11px] font-mono font-bold text-stone-700 bg-white px-2 py-1 rounded-lg border border-stone-200">
                        {PAPER_SIZES.find((s) => s.id === selectedPaperSize)?.dimensionsMm}
                      </span>
                    </div>
                  </div>

                  {/* Paper Sizes Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {PAPER_SIZES.map((item) => {
                      const isSelected = selectedPaperSize === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedPaperSize(item.id)}
                          className={`py-1.5 px-2 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-800 font-bold shadow-xs'
                              : 'bg-white text-stone-900 border-stone-300 hover:bg-stone-100 hover:border-stone-400'
                          }`}
                        >
                          <span className="font-sans font-bold text-xs leading-none">
                            {item.shortCode}
                          </span>
                          <span
                            className={`text-[9px] leading-tight block ${
                              isSelected ? 'text-emerald-100' : 'text-stone-500'
                            }`}
                          >
                            {item.tag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Document Formats Grid */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-sans font-bold text-stone-800 flex items-center gap-1.5">
                    <FileText size={14} className="text-emerald-700" />
                    <span>Select Document Format</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* 1. PDF Document */}
                    <button
                      type="button"
                      onClick={() => handleStartExport('pdf')}
                      className="p-3 bg-white hover:bg-red-50/50 border border-stone-200 hover:border-red-400 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer active:scale-98 group shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <FileText size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-sans text-xs font-bold text-stone-900">
                              PDF Document
                            </span>
                            <span className="text-[8.5px] font-sans font-bold bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                              300 DPI
                            </span>
                          </div>
                          <span className="text-[10.5px] text-stone-500 font-sans block mt-0.5">
                            Print-ready document with exact page layout
                          </span>
                        </div>
                      </div>
                      <Download size={16} className="text-stone-400 group-hover:text-red-700 transition-colors" />
                    </button>

                    {/* 2. Word DOC */}
                    <button
                      type="button"
                      onClick={() => handleStartExport('doc')}
                      className="p-3 bg-white hover:bg-blue-50/50 border border-stone-200 hover:border-blue-400 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer active:scale-98 group shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <FileType size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-sans text-xs font-bold text-stone-900">
                              Word Document (.doc)
                            </span>
                            <span className="text-[8.5px] font-sans font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                              Editable
                            </span>
                          </div>
                          <span className="text-[10.5px] text-stone-500 font-sans block mt-0.5">
                            Full RTL Nastaliq formatting for Microsoft Word
                          </span>
                        </div>
                      </div>
                      <Download size={16} className="text-stone-400 group-hover:text-blue-700 transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* QUICK UTILITIES (Always visible) */}
            <div className="pt-2 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                <span>{copiedTextSuccess ? 'Copied!' : 'Copy Unicode'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartExport('txt')}
                className="py-2.5 px-3 bg-stone-50 hover:bg-emerald-50 text-stone-800 border border-stone-200 hover:border-emerald-300 rounded-xl font-sans text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-2xs"
              >
                <FileCode size={15} className="text-stone-600" />
                <span>Plain Text (.txt)</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartExport('share')}
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
            <div className="font-sans text-stone-600">Imran Magloo Studio</div>
          </div>
        </div>
      )}
    </div>
  );
};
