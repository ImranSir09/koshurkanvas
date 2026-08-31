import React, { useState } from 'react';
import { Download, Sparkles, X, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AppReleaseInfo, setSkippedVersion, CURRENT_APP_VERSION } from '../lib/versionService';

interface UpdateAvailableModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseInfo: AppReleaseInfo | null;
}

export const UpdateAvailableModal: React.FC<UpdateAvailableModalProps> = ({
  isOpen,
  onClose,
  releaseInfo,
}) => {
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!isOpen || !releaseInfo) return null;

  const handleDownloadUpdate = () => {
    setDownloadStarted(true);
    const downloadUrl = releaseInfo.apkDownloadUrl || releaseInfo.releaseUrl;
    
    // Open in system browser for APK download
    try {
      window.open(downloadUrl, '_system') || window.open(downloadUrl, '_blank');
    } catch {
      window.location.href = downloadUrl;
    }
  };

  const handleSkipVersion = () => {
    if (releaseInfo.versionName) {
      setSkippedVersion(releaseInfo.versionName);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200" dir="ltr">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Sparkles size={22} className="text-amber-300 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-sans uppercase tracking-wider text-emerald-200 font-bold block">
                Update Available
              </span>
              <h3 className="text-lg font-bold font-sans text-white leading-tight">
                {releaseInfo.releaseTitle || `New Version v${releaseInfo.versionName}`}
              </h3>
            </div>
          </div>

          {/* Version Pills */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/15 text-xs font-sans">
            <span className="px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-100 border border-emerald-400/30 font-medium">
              Current: v{CURRENT_APP_VERSION}
            </span>
            <span className="text-emerald-300">→</span>
            <span className="px-2.5 py-1 rounded-full bg-amber-400 text-stone-950 font-bold shadow-2xs">
              Latest: v{releaseInfo.versionName}
            </span>
          </div>
        </div>

        {/* Modal Body / Release Notes */}
        <div className="p-5 flex-1 overflow-y-auto max-h-[50vh] space-y-3 font-sans">
          <div className="flex items-center gap-2 text-xs text-stone-600 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/60">
            <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
            <span>Official APK build published directly to GitHub Releases.</span>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              What's New in v{releaseInfo.versionName}
            </h4>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 leading-relaxed whitespace-pre-wrap font-sans max-h-40 overflow-y-auto">
              {releaseInfo.releaseNotes || 'Includes latest fixes, performance enhancements, and new writing features.'}
            </div>
          </div>

          {downloadStarted && (
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-sans font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
              <span>Download initiated! Check your Android browser downloads.</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 font-sans">
          <button
            type="button"
            onClick={handleSkipVersion}
            className="w-full sm:w-auto px-3 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors text-center cursor-pointer order-3 sm:order-1"
          >
            Skip this version
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-stone-700 bg-stone-200 hover:bg-stone-300 transition-colors cursor-pointer"
            >
              Later
            </button>
            <button
              type="button"
              onClick={handleDownloadUpdate}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Download size={15} />
              <span>Update Now</span>
              <ExternalLink size={12} className="opacity-70" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
