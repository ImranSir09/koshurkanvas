import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  X,
  Download,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Layers,
  Terminal,
  Cpu,
  Share2,
} from 'lucide-react';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallSuccess(true);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-4 py-3.5 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-2xs">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm text-white leading-tight">
                Android App & APK Ready
              </h3>
              <p className="text-[11px] font-sans text-stone-300 leading-tight">
                کٲشُر لیٚکھُن سٹوڈیو — Android Studio & PWA Setup
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-4 overflow-y-auto space-y-4 custom-scrollbar text-stone-800">
          {/* Method 1: Instant PWA Install on Android */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <h4 className="font-sans font-bold text-xs text-emerald-950">
                  Instant Direct Android Installation (PWA)
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-mono font-bold">
                Recommended
              </span>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed font-sans">
              Installs Kashur Kanvas directly to your Android home screen as an offline standalone Android app with standard app icon and splash screen.
            </p>

            {deferredPrompt ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-sans font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Download size={16} />
                <span>Install Kashur Kanvas on Android</span>
              </button>
            ) : isInstalled || installSuccess ? (
              <div className="p-2.5 bg-emerald-100/80 rounded-xl border border-emerald-300 flex items-center gap-2 text-emerald-900 text-xs font-semibold">
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                <span>App is installed on this device and ready to launch!</span>
              </div>
            ) : (
              <div className="bg-white/90 p-3 rounded-lg border border-emerald-200/80 text-[11px] text-stone-700 space-y-1.5 font-sans">
                <p className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Share2 size={13} className="text-emerald-700" />
                  Manual Installation on Android Chrome / Edge:
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-stone-600">
                  <li>Open browser menu (tap <strong>⋮ 3 dots</strong> in top right)</li>
                  <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
                  <li>Confirm installation to launch Kashur Kanvas natively</li>
                </ol>
              </div>
            )}
          </div>

          {/* Method 2: Native Capacitor APK Project Folder */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-stone-800 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <h4 className="font-sans font-bold text-xs text-stone-900">
                Native Android Studio Project (Capacitor)
              </h4>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              The project root includes a full <strong>Android Studio project structure</strong> inside the <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-900 font-mono text-[11px]">/android</code> folder.
            </p>

            <div className="bg-stone-900 text-emerald-400 p-3 rounded-lg font-mono text-[11px] space-y-1 overflow-x-auto select-all border border-stone-800">
              <p className="text-stone-400"># 1. Sync assets & build Android app</p>
              <p>npm run cap:sync</p>
              <p className="text-stone-400 pt-1"># 2. Open project in Android Studio</p>
              <p>npx cap open android</p>
              <p className="text-stone-400 pt-1"># 3. In Android Studio: Build -&gt; Build APK(s)</p>
            </div>
          </div>

          {/* Method 3: PWABuilder 1-Click Online APK Generator */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <h4 className="font-sans font-bold text-xs text-stone-900">
                Online APK Generator (PWABuilder)
              </h4>
            </div>
            <p className="text-xs text-stone-600 font-sans leading-relaxed">
              You can also generate an APK or Google Play AAB bundle by pasting this app's URL into PWABuilder:
            </p>
            <a
              href="https://www.pwabuilder.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-900 text-xs font-sans font-bold transition-colors"
            >
              <span>Open PWABuilder.com</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-sans font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
