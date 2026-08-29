import React, { useState, useRef, useEffect } from 'react';
import { KashurDocument } from '../types';
import {
  X,
  FileText,
  Trash2,
  Plus,
  Calendar,
  FolderOpen,
  CheckCircle2,
  MoreVertical,
  Edit2,
  Copy,
  Download,
  Check,
  Bell,
  Send,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import {
  getNotificationState,
  togglePushNotifications,
  toggleLocalNotifications,
  sendTestNotification,
} from '../lib/notificationService';

interface ProjectsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documents: KashurDocument[];
  currentDocId: string;
  onSelectDocument: (doc: KashurDocument) => void;
  onNewDocument: () => void;
  onDeleteDocument: (id: string) => void;
  onRenameDocument?: (id: string, newTitle: string) => void;
  onDuplicateDocument?: (id: string) => void;
  onExportDocument?: (doc: KashurDocument) => void;
}

export const ProjectsDrawer: React.FC<ProjectsDrawerProps> = ({
  isOpen,
  onClose,
  documents,
  currentDocId,
  onSelectDocument,
  onNewDocument,
  onDeleteDocument,
  onRenameDocument,
  onDuplicateDocument,
  onExportDocument,
}) => {
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState<string>('');
  const [notifState, setNotifState] = useState(getNotificationState());
  const [testSentMsg, setTestSentMsg] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setNotifState(getNotificationState());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePush = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    togglePushNotifications(checked);
    setNotifState(getNotificationState());
  };

  const handleToggleLocal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    await toggleLocalNotifications(checked);
    setNotifState(getNotificationState());
  };

  const handleSendTest = async () => {
    const ok = await sendTestNotification(
      'کٲشُر لیٚکھُن – Notification Test',
      'Push & Local notifications are working perfectly on your device!'
    );
    if (ok) {
      setTestSentMsg('Test notification sent!');
      setTimeout(() => setTestSentMsg(null), 3000);
    } else {
      setTestSentMsg('Notification sent (check notification shade)');
      setTimeout(() => setTestSentMsg(null), 3000);
    }
  };

  const handleStartRename = (doc: KashurDocument) => {
    setRenamingDocId(doc.id);
    setRenameText(doc.title || 'مسودہ');
    setActiveMenuDocId(null);
  };

  const handleSaveRename = (docId: string) => {
    if (renameText.trim() && onRenameDocument) {
      onRenameDocument(docId, renameText.trim());
    }
    setRenamingDocId(null);
  };

  const handleTouchStart = (doc: KashurDocument) => {
    longPressTimerRef.current = setTimeout(() => {
      setActiveMenuDocId(doc.id);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overscroll-none touch-none"
      onClick={() => {
        setActiveMenuDocId(null);
        setRenamingDocId(null);
      }}
    >
      <div
        className="w-full sm:max-w-xl max-h-[88vh] sm:max-h-[85vh] bg-white border border-stone-200 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 0rem)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 0rem)',
        }}
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe / Drag indicator bar */}
        <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-stone-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
              <FolderOpen size={18} />
            </div>
            <div>
              <h3 className="font-sans text-base sm:text-lg font-bold text-stone-900 leading-tight">
                Saved Projects
              </h3>
              <p className="text-[11px] text-stone-500 font-sans leading-none mt-0.5">
                Saved Documents & Drafts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action / Count Bar */}
        <div className="px-4 py-2.5 sm:px-5 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-2 shrink-0">
          <span className="text-xs font-sans font-bold text-stone-600">
            Total Projects: {documents.length}
          </span>

          <button
            type="button"
            onClick={() => {
              onNewDocument();
              onClose();
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer min-h-[38px]"
          >
            <Plus size={15} />
            <span>New Document</span>
          </button>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 flex flex-col gap-2.5">
          {documents.length === 0 ? (
            <div className="py-12 text-center text-stone-400 flex flex-col items-center justify-center gap-2">
              <FileText size={32} className="opacity-40" />
              <p className="font-sans text-sm">No saved documents yet</p>
            </div>
          ) : (
            documents.map((doc) => {
              const isCurrent = doc.id === currentDocId;
              const isMenuOpen = activeMenuDocId === doc.id;
              const isRenaming = renamingDocId === doc.id;

              return (
                <div
                  key={doc.id}
                  onTouchStart={() => handleTouchStart(doc)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                  onClick={() => {
                    if (isMenuOpen || isRenaming) return;
                    onSelectDocument(doc);
                    onClose();
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all relative flex flex-col gap-2 cursor-pointer select-none active:scale-[0.99] ${
                    isCurrent
                      ? 'bg-emerald-50/80 border-emerald-300 shadow-xs ring-1 ring-emerald-400/40'
                      : 'bg-white border-stone-200 hover:bg-stone-50 hover:border-stone-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Document Details */}
                    <div className="flex-1 text-right min-w-0">
                      {isRenaming ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={renameText}
                            onChange={(e) => setRenameText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(doc.id);
                              if (e.key === 'Escape') setRenamingDocId(null);
                            }}
                            className="px-2.5 py-1 bg-white border border-emerald-500 rounded-lg text-sm font-nastaliq font-bold w-full outline-none"
                            autoFocus
                            dir="rtl"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(doc.id)}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {isCurrent && (
                            <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                          )}
                          <h4 className="font-nastaliq text-base sm:text-lg font-bold text-stone-900 truncate leading-snug">
                            {doc.title || 'Untitled Document'}
                          </h4>
                        </div>
                      )}

                      <p className="font-nastaliq text-xs text-stone-600 truncate mt-1 leading-relaxed">
                        {doc.content.trim() || <span className="italic text-stone-400 font-sans">Empty Draft</span>}
                      </p>

                      <div className="flex items-center gap-2.5 mt-2 text-[10px] font-sans text-stone-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(doc.updatedAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{doc.content.length} characters</span>
                      </div>
                    </div>

                    {/* Contextual Options Button */}
                    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setActiveMenuDocId(isMenuOpen ? null : doc.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                        title="Options"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu for Rename, Duplicate, Export, Delete */}
                      {isMenuOpen && (
                        <div
                          className="absolute left-0 top-9 w-40 bg-white border border-stone-200 rounded-xl shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-left"
                          dir="ltr"
                        >
                          <button
                            type="button"
                            onClick={() => handleStartRename(doc)}
                            className="w-full px-3 py-2 flex items-center gap-2 text-xs font-sans font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-900"
                          >
                            <Edit2 size={13} className="text-emerald-700" />
                            <span>Rename</span>
                          </button>

                          {onDuplicateDocument && (
                            <button
                              type="button"
                              onClick={() => {
                                onDuplicateDocument(doc.id);
                                setActiveMenuDocId(null);
                              }}
                              className="w-full px-3 py-2 flex items-center gap-2 text-xs font-sans font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 border-t border-stone-100"
                            >
                              <Copy size={13} className="text-emerald-700" />
                              <span>Duplicate</span>
                            </button>
                          )}

                          {onExportDocument && (
                            <button
                              type="button"
                              onClick={() => {
                                onExportDocument(doc);
                                setActiveMenuDocId(null);
                              }}
                              className="w-full px-3 py-2 flex items-center gap-2 text-xs font-sans font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 border-t border-stone-100"
                            >
                              <Download size={13} className="text-emerald-700" />
                              <span>Export</span>
                            </button>
                          )}

                          {documents.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteDocument(doc.id);
                                setActiveMenuDocId(null);
                              }}
                              className="w-full px-3 py-2 flex items-center gap-2 text-xs font-sans font-medium text-rose-600 hover:bg-rose-50 border-t border-stone-100"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Notifications & Reminders Card */}
          <div className="mt-3 p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col gap-3" dir="ltr">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Bell size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-sans font-bold text-stone-900 leading-tight">
                    Push & Local Notifications
                  </h4>
                  <p className="text-[10px] font-sans text-stone-500">
                    Reminders, Calligraphy Prompts & FCM Alerts
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendTest}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-lg text-xs font-sans font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="Send a test notification to your device"
              >
                <Send size={12} />
                <span>Test</span>
              </button>
            </div>

            {testSentMsg && (
              <div className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 text-[11px] font-sans font-medium flex items-center gap-1.5 animate-in fade-in">
                <Sparkles size={13} className="text-emerald-700 shrink-0" />
                <span>{testSentMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-stone-200/60">
              {/* Push Notifications Toggle */}
              <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200 cursor-pointer hover:border-emerald-300 transition-colors">
                <div className="flex items-center gap-2">
                  <Smartphone size={14} className="text-stone-500" />
                  <span className="text-xs font-sans font-medium text-stone-800">Remote Push (FCM)</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifState.pushEnabled}
                  onChange={handleTogglePush}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </label>

              {/* Daily Local Notifications Toggle */}
              <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200 cursor-pointer hover:border-emerald-300 transition-colors">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-stone-500" />
                  <span className="text-xs font-sans font-medium text-stone-800">Daily Proverb Alert</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifState.localEnabled}
                  onChange={handleToggleLocal}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
