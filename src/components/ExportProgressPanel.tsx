import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  X,
  Share2,
  ExternalLink,
  RotateCcw,
  Check,
  Loader2,
  FileImage,
  FileText,
  FileType,
  FileCode,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ExportStageName, formatFileSize } from '../lib/exportEngine';
import { shareFileNative, isNativeAndroid } from '../lib/nativeStorage';

export interface ExportProgressPanelProps {
  fileName: string;
  formatLabel: string;
  dimensionsStr: string;
  stage: ExportStageName | 'Failed' | 'Cancelled';
  percent?: number;
  sizeBytes: number | null;
  errorMessage?: string | null;
  savedUri?: string | null;
  savedPath?: string | null;
  exportedDataUrl?: string | null;
  onCancel: () => void;
  onRetry: () => void;
  onDone: () => void;
  onOpen?: () => void;
  onShare?: () => void;
}

export const ExportProgressPanel: React.FC<ExportProgressPanelProps> = ({
  fileName,
  formatLabel,
  dimensionsStr,
  stage,
  sizeBytes,
  errorMessage,
  savedUri,
  savedPath,
  exportedDataUrl,
  onCancel,
  onRetry,
  onDone,
  onOpen,
  onShare,
}) => {
  const isComplete = stage === 'Complete';
  const isFailed = stage === 'Failed';
  const isExporting = !isComplete && !isFailed && stage !== 'Cancelled';

  // Format Icon selection
  const getFormatIcon = () => {
    const fmt = formatLabel.toLowerCase();
    if (fmt.includes('pdf')) return <FileText size={20} className="text-red-700" />;
    if (fmt.includes('doc')) return <FileType size={20} className="text-blue-700" />;
    if (fmt.includes('txt')) return <FileCode size={20} className="text-stone-700" />;
    if (fmt.includes('svg')) return <Layers size={20} className="text-cyan-700" />;
    if (fmt.includes('transparent')) return <Sparkles size={20} className="text-purple-700" />;
    if (fmt.includes('jpg') || fmt.includes('jpeg')) return <FileImage size={20} className="text-amber-700" />;
    return <FileImage size={20} className="text-emerald-700" />;
  };

  const formattedSize = formatFileSize(sizeBytes);

  const handleOpenAction = () => {
    if (onOpen) {
      onOpen();
      return;
    }
    if (savedUri && isNativeAndroid()) {
      const link = document.createElement('a');
      link.href = savedUri;
      link.target = '_blank';
      link.click();
    } else if (exportedDataUrl) {
      const link = document.createElement('a');
      link.download = fileName;
      link.href = exportedDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShareAction = async () => {
    if (onShare) {
      onShare();
      return;
    }
    if (exportedDataUrl || savedUri) {
      await shareFileNative(
        exportedDataUrl || savedUri || '',
        fileName,
        'KoshurKanvas Design',
        'Created with KoshurKanvas'
      );
    }
  };

  return (
    <div
      className="w-full max-w-md bg-white border border-stone-300 rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col gap-4 text-stone-900 animate-in fade-in zoom-in-95 duration-150 select-none"
      dir="ltr"
    >
      {/* Header Section */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2.5">
          {isComplete ? (
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} className="text-emerald-700" />
            </div>
          ) : isFailed ? (
            <div className="w-8 h-8 rounded-full bg-red-100 border border-red-300 flex items-center justify-center shrink-0">
              <AlertCircle size={20} className="text-red-700" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <Loader2 size={18} className="text-emerald-700 animate-spin" />
            </div>
          )}

          <div>
            <h3 className="font-sans text-base font-bold text-stone-950 leading-tight">
              {isComplete
                ? '✓ Export complete'
                : isFailed
                ? 'Export failed'
                : 'Exporting Design'}
            </h3>
            {savedPath && isComplete && (
              <span className="text-[11px] font-mono text-emerald-800 block mt-0.5">
                Saved to {savedPath}
              </span>
            )}
          </div>
        </div>

        {isExporting && (
          <button
            type="button"
            onClick={onCancel}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            title="Cancel Export"
            aria-label="Cancel Export"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* File Info Block */}
      <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center shrink-0 shadow-2xs">
          {getFormatIcon()}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div className="font-mono text-xs font-bold text-stone-900 truncate" title={fileName}>
            {fileName}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-1.5 py-0.2 text-[10px] font-bold font-sans rounded bg-stone-200 text-stone-800 border border-stone-300">
              {formatLabel}
            </span>
            <span className="text-[11px] font-mono text-stone-600">
              {dimensionsStr}
            </span>
          </div>
        </div>
      </div>

      {/* Loading View (During Export) */}
      {isExporting && (
        <div className="flex flex-col items-center justify-center gap-3 py-3 text-center">
          <div className="flex items-center gap-2 text-xs font-sans font-bold text-emerald-800">
            <Loader2 size={16} className="text-emerald-700 animate-spin" />
            <span>Processing and saving file...</span>
          </div>

          {/* Cancel Action Button */}
          <div className="w-full pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 border border-stone-300 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              <X size={15} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Completed View */}
      {isComplete && (
        <div className="flex flex-col gap-3 py-1">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col gap-1.5 text-xs text-stone-700">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">File type:</span>
              <span className="font-bold font-sans text-stone-900">{formatLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Final dimensions:</span>
              <span className="font-mono text-stone-900">{dimensionsStr}</span>
            </div>
            <div className="flex items-center justify-between border-t border-emerald-200/60 pt-1.5">
              <span className="text-stone-500">Final file size:</span>
              <span className="font-mono font-bold text-emerald-900">{formattedSize}</span>
            </div>
          </div>

          {/* Action Buttons: Open, Share, Done */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={handleOpenAction}
              className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <ExternalLink size={14} />
              <span>Open</span>
            </button>

            <button
              type="button"
              onClick={handleShareAction}
              className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={onDone}
              className="py-2.5 px-3 bg-stone-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <Check size={14} />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}

      {/* Failure View */}
      {isFailed && (
        <div className="flex flex-col gap-3 py-1">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-mono text-red-900 break-words max-h-32 overflow-y-auto">
            {errorMessage || 'An error occurred during export processing.'}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onRetry}
              className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <RotateCcw size={14} />
              <span>Try Again</span>
            </button>

            <button
              type="button"
              onClick={onDone}
              className="py-2.5 px-3 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <span>Close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
