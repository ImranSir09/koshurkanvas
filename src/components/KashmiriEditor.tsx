import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  CanvasAspectRatio,
  CanvasBackgroundConfig,
  KashurDocument,
  SelectionRange,
  TextStyleProperties,
  TextStyleSpan,
  TextLayer,
  HistorySnapshot,
  HistoryActionCategory,
  HistoryStats,
} from '../types';
import { KashmiriKeyboard } from './KashmiriKeyboard';
import { MobileTextDesignToolbar } from './MobileTextDesignToolbar';
import { CanvasSettingsPanel } from './CanvasSettingsPanel';
import { CanvasTextLayerObject } from './CanvasTextLayerObject';
import { CombinedCanvasSelectionBox } from './CombinedCanvasSelectionBox';
import { LayerManagerPanel } from './LayerManagerPanel';
import { VoiceInputButton } from './VoiceInputButton';
import { BatchHistoryModal } from './BatchHistoryModal';
import { useVisualViewport } from '../lib/useVisualViewport';
import {
  shiftSpansOnTextChange,
  normalizeSelection,
  getEffectiveStyleAtRange,
} from '../lib/textEngine';
import {
  groupSelectedLayers,
  ungroupSelectedLayers,
  updateLayersCollection,
  applyStyleToLayers,
  duplicateTextLayer,
  mergeSelectedLayers,
  alignSelectedLayers,
  deleteSelectedLayers,
  LayerAlignmentType,
} from '../lib/layerUtils';
import {
  createHistorySnapshot,
  describeTextChange,
  describeStyleChange,
  cloneLayers,
  cloneSpans,
  cloneCanvasConfig,
  cloneStyle,
} from '../lib/historyManager';
import { DEFAULT_TEXT_STYLE } from '../lib/kashmiriData';
import { getFontFamilyCSS } from '../lib/fontUtils';
import {
  RotateCcw,
  RotateCw,
  History,
  Layers,
  Settings,
  Plus,
  Minus,
  Edit3,
  FileText,
  Copy,
  Check,
  Trash2,
  ClipboardPaste,
  MoveHorizontal,
  AlignRight,
  AlignLeft,
  ZoomIn,
  ZoomOut,
  Keyboard,
  Layout,
  Type,
  Eye,
  ChevronDown,
  Magnet,
} from 'lucide-react';
import { calculateSnapping, SnapGuide } from '../lib/snappingEngine';
import { playSnapSound } from '../lib/soundEffects';
import { toKashmiriNumerals } from '../lib/kashmiriTextTools';

export const QUICK_KASHMIRI_SPECIAL_CHARS = [
  { char: 'ٲ', label: 'Alif Madda (ٲ)', title: 'ٲ - Alif Madda' },
  { char: 'ۄ', label: 'Waw Ring (ۄ)', title: 'ۄ - Waw Ring' },
  { char: 'ؠ', label: 'Tshae Yeh (ؠ)', title: 'ؠ - Tshae Yeh' },
  { char: 'ژ', label: 'Tse (ژ)', title: 'ژ - Tse' },
  { char: 'ۆ', label: 'Short O (ۆ)', title: 'ۆ - Short O' },
  { char: 'ےٚ', label: 'Bari Yeh Inverted V (ےٚ)', title: 'ےٚ - Bari Yeh Inverted V' },
  { char: 'ـ', label: 'Kashida (ـ)', title: 'ـ - Kashida (Tatweel)' },
  { char: 'ٕ', label: 'Kashmiri Zer (ٕ)', title: 'ٕ - Kashmiri Zer (Inverted V below)' },
  { char: 'ٔ', label: 'Hamza (ٔ)', title: 'ٔ - Hamza above' },
  { char: 'ٚ', label: 'Inverted V (ٚ)', title: 'ٚ - Inverted V above' },
  { char: '٘', label: 'Noon Ghunna (٘)', title: '٘ - Noon Ghunna above' },
  { char: 'ْ', label: 'Jazm (ْ)', title: 'ْ - Jazm / Sukun' },
  { char: 'َ', label: 'Zabar (َ)', title: 'َ - Zabar (Fatha)' },
  { char: 'ِ', label: 'Zer (ِ)', title: 'ِ - Zer (Kasra)' },
  { char: 'ُ', label: 'Pesh (ُ)', title: 'ُ - Pesh (Damma)' },
  { char: '۔', label: 'Full Stop (۔)', title: '۔ - Kashmiri Full Stop' },
  { char: '،', label: 'Comma (،)', title: '، - Kashmiri Comma' },
  { char: '؟', label: 'Question (؟)', title: '؟ - Kashmiri Question Mark' },
  { char: '؛', label: 'Semicolon (؛)', title: '؛ - Semicolon' },
  { char: '«', label: 'Quote («)', title: '« - Right Guilloche' },
  { char: '»', label: 'Quote (»)', title: '» - Left Guilloche' },
];

export function getCanvasRefDimensions(
  aspectRatio?: CanvasAspectRatio,
  orientation?: 'portrait' | 'landscape',
  customW?: number,
  customH?: number
): { refWidth: number; refHeight: number } {
  const isLandscape = orientation === 'landscape';

  if (aspectRatio === 'custom' && customW && customH) {
    const w = isLandscape ? Math.max(customW, customH) : customW;
    const h = isLandscape ? Math.min(customW, customH) : customH;
    return {
      refWidth: isLandscape ? 680 : 520,
      refHeight: Math.max(100, Math.round((isLandscape ? 680 : 520) * (h / w))),
    };
  }

  switch (aspectRatio) {
    case '1:1':
      return { refWidth: 520, refHeight: 520 };
    case '4:5':
      return isLandscape ? { refWidth: 575, refHeight: 460 } : { refWidth: 460, refHeight: 575 };
    case '9:16':
      return isLandscape ? { refWidth: 640, refHeight: 360 } : { refWidth: 360, refHeight: 640 };
    case '16:9':
      return isLandscape ? { refWidth: 720, refHeight: 405 } : { refWidth: 405, refHeight: 720 };
    case '3:4':
      return isLandscape ? { refWidth: 640, refHeight: 480 } : { refWidth: 480, refHeight: 640 };
    case '2:3':
      return isLandscape ? { refWidth: 640, refHeight: 426 } : { refWidth: 426, refHeight: 640 };
    case 'a3':
      return isLandscape ? { refWidth: 720, refHeight: 509 } : { refWidth: 509, refHeight: 720 };
    case 'a4':
      return isLandscape ? { refWidth: 680, refHeight: 480 } : { refWidth: 520, refHeight: 735 };
    case 'a5':
      return isLandscape ? { refWidth: 600, refHeight: 424 } : { refWidth: 424, refHeight: 600 };
    case 'a6':
      return isLandscape ? { refWidth: 640, refHeight: 450 } : { refWidth: 450, refHeight: 640 };
    case 'letter':
      return isLandscape ? { refWidth: 680, refHeight: 525 } : { refWidth: 525, refHeight: 680 };
    case 'legal':
      return isLandscape ? { refWidth: 720, refHeight: 437 } : { refWidth: 437, refHeight: 720 };
    case 'tabloid':
      return isLandscape ? { refWidth: 720, refHeight: 465 } : { refWidth: 465, refHeight: 720 };
    case 'b4':
    case 'b5':
    case 'b6':
      return isLandscape ? { refWidth: 640, refHeight: 450 } : { refWidth: 450, refHeight: 640 };
    case 'auto':
    default:
      return { refWidth: 620, refHeight: 480 };
  }
}

export type MobileTab = 'input_text' | 'canvas';
export type KeyboardType = 'system' | 'kashmiri' | 'none';

interface KashmiriEditorProps {
  document: KashurDocument;
  onUpdateDocument: (updated: Partial<KashurDocument>) => void;
  onOpenCharacterPicker?: () => void;
  onOpenExport: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isFocusedWritingMode: boolean;
  setIsFocusedWritingMode: (val: boolean) => void;
  onHistoryStatsChange?: (stats: HistoryStats) => void;
}

export const KashmiriEditor: React.FC<KashmiriEditorProps> = ({
  document: doc,
  onUpdateDocument,
  onOpenCharacterPicker,
  onOpenExport,
  soundEnabled,
  onToggleSound,
  isFocusedWritingMode,
  setIsFocusedWritingMode,
  onHistoryStatsChange,
}) => {
  // Primary Two-Tab Workflow: 'input_text' (Unicode entry) and 'canvas' (Visual design)
  const [activeTab, setActiveTab] = useState<MobileTab>('canvas');

  // Keyboard Selector State (Input Text tab only): 'system' | 'kashmiri' | 'none'
  const [activeKeyboard, setActiveKeyboard] = useState<KeyboardType>('kashmiri');

  // Authoritative Native Input State (Input Text tab)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [cursorPos, setCursorPos] = useState<number>(doc.content.length);
  const [, setSelection] = useState<SelectionRange>({
    start: 0,
    end: 0,
    text: '',
  });

  // UI Panels
  const [showCanvasPanel, setShowCanvasPanel] = useState<boolean>(false);
  const [showLayersPanel, setShowLayersPanel] = useState<boolean>(false);
  const [isBatchHistoryModalOpen, setIsBatchHistoryModalOpen] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [editorDirection, setEditorDirection] = useState<'rtl' | 'ltr'>('rtl');

  // Preview container ref for auto-scrolling to active text object
  const previewScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activePreviewLayerRef = useRef<HTMLDivElement | null>(null);

  // Initialize or ensure TextLayers exist
  const textLayers: TextLayer[] = useMemo(() => {
    if (doc.textLayers && doc.textLayers.length > 0) {
      return doc.textLayers;
    }
    return [
      {
        id: 'layer-primary',
        name: 'Layer 1',
        type: 'text',
        text: doc.content || 'ازکیا چھُ تُہنْدس دماغس منْز',
        x: 40,
        y: 80,
        width: 480,
        height: 180,
        rotation: 0,
        scale: 1,
        opacity: 1,
        zIndex: 10,
        isLocked: false,
        isHidden: false,
        style: { ...(doc.defaultStyle || DEFAULT_TEXT_STYLE), fontSize: 32 },
      },
    ];
  }, [doc.textLayers, doc.content, doc.defaultStyle]);

  // Active Selected Layer (null when clicking outside on canvas to hide outline and floating menus)
  const [activeLayerId, setActiveLayerId] = useState<string | null>(
    doc.activeLayerId || (textLayers[0] ? textLayers[0].id : null)
  );

  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>(
    activeLayerId ? [activeLayerId] : []
  );

  const activeLayer = useMemo(() => {
    if (!activeLayerId) return null;
    return textLayers.find((l) => l.id === activeLayerId) || null;
  }, [textLayers, activeLayerId]);

  // Keep selectedLayerIds in sync when activeLayerId changes
  useEffect(() => {
    if (activeLayerId) {
      const activeL = textLayers.find((l) => l.id === activeLayerId);
      if (activeL?.groupId) {
        const groupIds = textLayers.filter((l) => l.groupId === activeL.groupId).map((l) => l.id);
        setSelectedLayerIds((prev) => {
          const hasAll = groupIds.every((gid) => prev.includes(gid));
          return hasAll ? prev : Array.from(new Set([...prev, ...groupIds]));
        });
      }
    } else {
      setSelectedLayerIds([]);
    }
  }, [activeLayerId, textLayers]);

  // When switching to input_text tab, ensure an active layer is selected so writing works directly
  useEffect(() => {
    if (activeTab === 'input_text' && !activeLayerId && textLayers.length > 0) {
      const firstId = textLayers[0].id;
      setActiveLayerId(firstId);
      setActiveFormatting(textLayers[0].style);
      onUpdateDocument({ activeLayerId: firstId, content: textLayers[0].text });
    }
  }, [activeTab, activeLayerId, textLayers, onUpdateDocument]);

  // Active Formatting State
  const [activeFormatting, setActiveFormatting] = useState<TextStyleProperties>(
    activeLayer?.style || doc.defaultStyle || DEFAULT_TEXT_STYLE
  );

  useEffect(() => {
    if (activeFormatting.direction) {
      setEditorDirection(activeFormatting.direction);
    }
  }, [activeFormatting.direction]);

  // Comprehensive Batch Undo/Redo History Manager Stack
  const historyRef = useRef<HistorySnapshot[]>([
    createHistorySnapshot({
      description: 'Initial document state',
      category: 'document_init',
      content: doc.content,
      textLayers: textLayers,
      spans: doc.spans || [],
      canvasConfig: doc.canvasConfig,
      defaultStyle: doc.defaultStyle,
      activeLayerId,
      selectedLayerIds,
      docTitle: doc.title,
    }),
  ]);
  const historyIndexRef = useRef<number>(0);
  const [, setHistoryVersion] = useState<number>(0);

  // Sync document switch to fresh history stack
  const lastDocIdRef = useRef<string>(doc.id);
  useEffect(() => {
    if (lastDocIdRef.current !== doc.id) {
      lastDocIdRef.current = doc.id;
      historyRef.current = [
        createHistorySnapshot({
          description: `Loaded "${doc.title || 'Document'}"`,
          category: 'document_init',
          content: doc.content,
          textLayers: textLayers,
          spans: doc.spans || [],
          canvasConfig: doc.canvasConfig,
          defaultStyle: doc.defaultStyle,
          activeLayerId: doc.activeLayerId || (textLayers[0]?.id || null),
          docTitle: doc.title,
        }),
      ];
      historyIndexRef.current = 0;
      setHistoryVersion((v) => v + 1);
    }
  }, [doc.id, doc.title, doc.content, textLayers, doc.spans, doc.canvasConfig, doc.defaultStyle, doc.activeLayerId]);

  // Central function to push snapshot to history
  const pushHistory = useCallback(
    (
      content: string,
      layers: TextLayer[],
      spans: TextStyleSpan[],
      description?: string,
      category: HistoryActionCategory = 'text_edit',
      meta?: HistorySnapshot['meta'],
      canvasConfig?: CanvasBackgroundConfig,
      defaultStyle?: TextStyleProperties
    ) => {
      const snap = createHistorySnapshot({
        description: description || 'Modified document',
        category,
        content,
        textLayers: layers,
        spans,
        canvasConfig: canvasConfig || doc.canvasConfig,
        defaultStyle: defaultStyle || doc.defaultStyle,
        activeLayerId,
        selectedLayerIds,
        docTitle: doc.title,
        meta,
      });

      const currentHist = historyRef.current.slice(0, historyIndexRef.current + 1);
      currentHist.push(snap);
      if (currentHist.length > 100) currentHist.shift();
      historyRef.current = currentHist;
      historyIndexRef.current = currentHist.length - 1;
      setHistoryVersion((v) => v + 1);
    },
    [doc.canvasConfig, doc.defaultStyle, doc.title, activeLayerId, selectedLayerIds]
  );

  // Apply Snapshot state
  const applySnapshot = useCallback(
    (snap: HistorySnapshot) => {
      const clonedL = cloneLayers(snap.textLayers);
      const clonedS = cloneSpans(snap.spans);
      const clonedC = cloneCanvasConfig(snap.canvasConfig);
      const clonedSt = cloneStyle(snap.defaultStyle);

      onUpdateDocument({
        content: snap.content,
        textLayers: clonedL,
        spans: clonedS,
        canvasConfig: clonedC,
        defaultStyle: clonedSt,
        activeLayerId: snap.activeLayerId || (clonedL[0]?.id || null),
      });

      if (snap.activeLayerId) {
        setActiveLayerId(snap.activeLayerId);
        const activeL = clonedL.find((l) => l.id === snap.activeLayerId);
        if (activeL) {
          setActiveFormatting(activeL.style);
        }
      }
      if (snap.selectedLayerIds) {
        setSelectedLayerIds(snap.selectedLayerIds);
      }
      setCursorPos(snap.content.length);
      setHistoryVersion((v) => v + 1);
    },
    [onUpdateDocument]
  );

  // Single Undo (1 step back)
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const snap = historyRef.current[historyIndexRef.current];
      applySnapshot(snap);
    }
  }, [applySnapshot]);

  // Single Redo (1 step forward)
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const snap = historyRef.current[historyIndexRef.current];
      applySnapshot(snap);
    }
  }, [applySnapshot]);

  // Batch Undo (revert multiple steps at once)
  const handleBatchUndo = useCallback(
    (steps: number) => {
      const targetIndex = Math.max(0, historyIndexRef.current - steps);
      if (targetIndex !== historyIndexRef.current) {
        historyIndexRef.current = targetIndex;
        const snap = historyRef.current[targetIndex];
        applySnapshot(snap);
      }
    },
    [applySnapshot]
  );

  // Batch Redo (restore multiple steps at once)
  const handleBatchRedo = useCallback(
    (steps: number) => {
      const targetIndex = Math.min(historyRef.current.length - 1, historyIndexRef.current + steps);
      if (targetIndex !== historyIndexRef.current) {
        historyIndexRef.current = targetIndex;
        const snap = historyRef.current[targetIndex];
        applySnapshot(snap);
      }
    },
    [applySnapshot]
  );

  // Jump to specific snapshot index directly
  const handleJumpToSnapshot = useCallback(
    (targetIndex: number) => {
      if (targetIndex >= 0 && targetIndex < historyRef.current.length && targetIndex !== historyIndexRef.current) {
        historyIndexRef.current = targetIndex;
        const snap = historyRef.current[targetIndex];
        applySnapshot(snap);
      }
    },
    [applySnapshot]
  );

  // Revert all changes in current session to initial snapshot
  const handleRevertToInitial = useCallback(() => {
    if (historyIndexRef.current > 0 && historyRef.current.length > 0) {
      historyIndexRef.current = 0;
      const snap = historyRef.current[0];
      applySnapshot(snap);
    }
  }, [applySnapshot]);

  // Sync history stats to parent (Header)
  useEffect(() => {
    if (onHistoryStatsChange) {
      const pastCount = historyIndexRef.current;
      const futureCount = Math.max(0, historyRef.current.length - 1 - historyIndexRef.current);
      onHistoryStatsChange({
        canUndo: pastCount > 0,
        canRedo: futureCount > 0,
        pastCount,
        futureCount,
        totalCount: historyRef.current.length,
        currentIndex: historyIndexRef.current,
        lastAction: historyRef.current[historyIndexRef.current],
        nextRedoAction: futureCount > 0 ? historyRef.current[historyIndexRef.current + 1] : undefined,
      });
    }
  }, [onHistoryStatsChange, applySnapshot, historyIndexRef.current, historyRef.current.length]);

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y, Ctrl+H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (isCmdOrCtrl && (e.key.toLowerCase() === 'h' || (e.altKey && e.key.toLowerCase() === 'h'))) {
        e.preventDefault();
        setIsBatchHistoryModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Custom App Events from Header & UI triggers
  useEffect(() => {
    const onUndoEvent = () => handleUndo();
    const onRedoEvent = () => handleRedo();
    const onOpenHistoryEvent = () => setIsBatchHistoryModalOpen(true);

    window.addEventListener('app-undo', onUndoEvent);
    window.addEventListener('app-redo', onRedoEvent);
    window.addEventListener('app-open-history', onOpenHistoryEvent);

    return () => {
      window.removeEventListener('app-undo', onUndoEvent);
      window.removeEventListener('app-redo', onRedoEvent);
      window.removeEventListener('app-open-history', onOpenHistoryEvent);
    };
  }, [handleUndo, handleRedo]);

  // Sync activeLayer style when activeLayer changes
  useEffect(() => {
    if (activeLayer) {
      setActiveFormatting(activeLayer.style);
    }
  }, [activeLayer]);

  // Auto-scroll the live preview to active layer when layer changes or activeTab becomes input_text
  useEffect(() => {
    if (activeTab === 'input_text' && activePreviewLayerRef.current) {
      try {
        activePreviewLayerRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      } catch (e) {
        // Fallback safely
      }
    }
  }, [activeLayerId, activeTab]);

  // Update selection tracking from native textarea
  const updateSelectionFromDOM = useCallback(() => {
    if (!textareaRef.current) return;
    const rawStart = textareaRef.current.selectionStart ?? 0;
    const rawEnd = textareaRef.current.selectionEnd ?? 0;
    const normalized = normalizeSelection(doc.content, rawStart, rawEnd);
    const start = normalized.start;
    const end = normalized.end;

    setCursorPos(start);

    if (start !== end) {
      const selectedSubstr = doc.content.substring(start, end);
      setSelection({
        start,
        end,
        text: selectedSubstr,
      });
      const effective = getEffectiveStyleAtRange(
        doc.content.length,
        doc.spans || [],
        activeLayer?.style || doc.defaultStyle || DEFAULT_TEXT_STYLE,
        start,
        end
      );
      setActiveFormatting(effective);
    } else {
      setSelection({
        start,
        end: start,
        text: '',
      });
      const effective = getEffectiveStyleAtRange(
        doc.content.length,
        doc.spans || [],
        activeLayer?.style || doc.defaultStyle || DEFAULT_TEXT_STYLE,
        start,
        start
      );
      setActiveFormatting(effective);
    }
  }, [doc.content, doc.spans, activeLayer?.style, doc.defaultStyle]);

  // Handle native typing in textarea
  const handleNativeTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const deltaLength = newContent.length - doc.content.length;
    const changePos = e.target.selectionStart - (deltaLength > 0 ? deltaLength : 0);
    const updatedSpans = shiftSpansOnTextChange(doc.spans || [], changePos, deltaLength);

    const updatedLayers = textLayers.map((layer) => {
      if (layer.id === activeLayerId) {
        return {
          ...layer,
          text: newContent,
        };
      }
      return layer;
    });

    onUpdateDocument({
      content: newContent,
      spans: updatedSpans,
      textLayers: updatedLayers,
      activeLayerId,
    });

    const desc = describeTextChange(doc.content, newContent);
    pushHistory(newContent, updatedLayers, updatedSpans, desc, 'text_edit', {
      layerId: activeLayerId || undefined,
      charsDelta: deltaLength,
    });
    updateSelectionFromDOM();
  };

  // Insert Text at exact cursor position
  const handleInsertText = useCallback(
    (textToInsert: string) => {
      const activeStart = textareaRef.current ? textareaRef.current.selectionStart : cursorPos;
      const activeEnd = textareaRef.current ? textareaRef.current.selectionEnd : cursorPos;
      const insertStart = activeStart;
      const insertEnd = activeEnd;

      const before = doc.content.slice(0, insertStart);
      const after = doc.content.slice(insertEnd);
      const newContent = before + textToInsert + after;
      const newPos = insertStart + textToInsert.length;

      const delta = textToInsert.length - (insertEnd - insertStart);
      const updatedSpans = shiftSpansOnTextChange(doc.spans || [], insertStart, delta);

      const updatedLayers = textLayers.map((layer) => {
        if (layer.id === activeLayerId) {
          return {
            ...layer,
            text: newContent,
          };
        }
        return layer;
      });

      onUpdateDocument({
        content: newContent,
        spans: updatedSpans,
        textLayers: updatedLayers,
        activeLayerId,
      });

      const desc =
        textToInsert.length === 1
          ? `Typed "${textToInsert}"`
          : `Inserted "${textToInsert.slice(0, 10)}${textToInsert.length > 10 ? '...' : ''}"`;

      pushHistory(newContent, updatedLayers, updatedSpans, desc, 'text_edit', {
        layerId: activeLayerId || undefined,
        charsDelta: textToInsert.length,
      });

      setCursorPos(newPos);
      setSelection({ start: newPos, end: newPos, text: '' });

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus({ preventScroll: true });
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 10);
    },
    [cursorPos, doc.content, doc.spans, textLayers, activeLayerId, onUpdateDocument, pushHistory]
  );

  // Handle external insert character events
  useEffect(() => {
    const handleInsertEvent = (e: any) => {
      if (e.detail && e.detail.char) {
        handleInsertText(e.detail.char);
      }
    };
    window.addEventListener('app-insert-char', handleInsertEvent);
    return () => window.removeEventListener('app-insert-char', handleInsertEvent);
  }, [handleInsertText]);

  const handleKeyboardBackspace = useCallback(() => {
    const activeStart = textareaRef.current ? textareaRef.current.selectionStart : cursorPos;
    const activeEnd = textareaRef.current ? textareaRef.current.selectionEnd : cursorPos;

    if (activeStart !== activeEnd) {
      const before = doc.content.slice(0, activeStart);
      const after = doc.content.slice(activeEnd);
      const newContent = before + after;
      const updatedSpans = shiftSpansOnTextChange(doc.spans || [], activeStart, -(activeEnd - activeStart));
      const updatedLayers = textLayers.map((l) => (l.id === activeLayerId ? { ...l, text: newContent } : l));
      onUpdateDocument({ content: newContent, spans: updatedSpans, textLayers: updatedLayers, activeLayerId });
      pushHistory(newContent, updatedLayers, updatedSpans, 'Deleted selected text', 'text_edit', {
        layerId: activeLayerId || undefined,
        charsDelta: -(activeEnd - activeStart),
      });
      setCursorPos(activeStart);
      setSelection({ start: activeStart, end: activeStart, text: '' });
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus({ preventScroll: true });
          textareaRef.current.setSelectionRange(activeStart, activeStart);
        }
      }, 10);
    } else if (activeStart > 0) {
      const before = doc.content.slice(0, activeStart - 1);
      const after = doc.content.slice(activeStart);
      const newContent = before + after;
      const updatedSpans = shiftSpansOnTextChange(doc.spans || [], activeStart - 1, -1);
      const updatedLayers = textLayers.map((l) => (l.id === activeLayerId ? { ...l, text: newContent } : l));
      onUpdateDocument({ content: newContent, spans: updatedSpans, textLayers: updatedLayers, activeLayerId });
      pushHistory(newContent, updatedLayers, updatedSpans, 'Deleted character (Backspace)', 'text_edit', {
        layerId: activeLayerId || undefined,
        charsDelta: -1,
      });
      const newPos = activeStart - 1;
      setCursorPos(newPos);
      setSelection({ start: newPos, end: newPos, text: '' });
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus({ preventScroll: true });
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 10);
    }
  }, [cursorPos, doc.content, doc.spans, textLayers, activeLayerId, onUpdateDocument, pushHistory]);

  const handleKeyboardEnter = useCallback(() => {
    handleInsertText('\n');
  }, [handleInsertText]);

  const handleKeyboardSpace = useCallback(() => {
    handleInsertText(' ');
  }, [handleInsertText]);

  // Formatting Update Handlers
  const handleUpdateStyle = useCallback(
    (styleUpdates: Partial<TextStyleProperties>) => {
      const newActiveStyle = { ...activeFormatting, ...styleUpdates };
      setActiveFormatting(newActiveStyle);

      const targetIds = selectedLayerIds.length > 0 ? selectedLayerIds : (activeLayerId ? [activeLayerId] : []);
      const updatedLayers = applyStyleToLayers(textLayers, targetIds, styleUpdates);

      onUpdateDocument({
        textLayers: updatedLayers,
        defaultStyle: newActiveStyle,
      });

      const desc = describeStyleChange(styleUpdates);
      pushHistory(doc.content, updatedLayers, doc.spans || [], desc, 'format_change', {
        layerId: activeLayerId || undefined,
      });
    },
    [activeFormatting, textLayers, activeLayerId, selectedLayerIds, doc.content, doc.spans, onUpdateDocument, pushHistory]
  );

  // Layer Management Callbacks
  const handleSelectLayer = (layerId: string, isMultiSelect = false) => {
    const target = textLayers.find((l) => l.id === layerId);
    if (!target) return;

    if (isMultiSelect) {
      setSelectedLayerIds((prev) => {
        const exists = prev.includes(layerId);
        return exists ? prev.filter((id) => id !== layerId) : [...prev, layerId];
      });
      setActiveLayerId(layerId);
      setActiveFormatting(target.style);
    } else {
      if (target.groupId) {
        const groupMembers = textLayers.filter((l) => l.groupId === target.groupId).map((l) => l.id);
        setSelectedLayerIds(groupMembers);
      } else {
        setSelectedLayerIds([layerId]);
      }
      setActiveLayerId(layerId);
      setActiveFormatting(target.style);
    }
  };

  const handleToggleSelectLayer = (layerId: string) => {
    handleSelectLayer(layerId, true);
  };

  const handleGroupLayers = (idsToGroup: string[]) => {
    if (idsToGroup.length < 2) return;
    const updatedLayers = groupSelectedLayers(textLayers, idsToGroup);
    setSelectedLayerIds(idsToGroup);
    onUpdateDocument({ textLayers: updatedLayers });
    pushHistory(doc.content, updatedLayers, doc.spans || [], `Grouped ${idsToGroup.length} layers`, 'layer_group');
  };

  const handleUngroupLayers = (targetGroupId: string) => {
    const updatedLayers = ungroupSelectedLayers(textLayers, targetGroupId);
    onUpdateDocument({ textLayers: updatedLayers });
    pushHistory(doc.content, updatedLayers, doc.spans || [], 'Ungrouped layers', 'layer_ungroup');
  };

  const handleMergeLayers = (idsToMerge: string[]) => {
    if (idsToMerge.length < 2) return;
    const { updatedLayers, mergedLayer } = mergeSelectedLayers(textLayers, idsToMerge);
    setActiveLayerId(mergedLayer.id);
    setSelectedLayerIds([mergedLayer.id]);
    setActiveFormatting(mergedLayer.style);
    onUpdateDocument({
      textLayers: updatedLayers,
      activeLayerId: mergedLayer.id,
      content: mergedLayer.text,
    });
    pushHistory(mergedLayer.text, updatedLayers, doc.spans || [], `Merged ${idsToMerge.length} layers`, 'layer_group');
  };

  const handleAlignLayers = (
    idsToAlign: string[],
    alignment: LayerAlignmentType
  ) => {
    if (idsToAlign.length === 0) return;
    const cfg = doc.canvasConfig || {
      aspectRatio: 'auto',
      color: '#ffffff',
    };
    const { refWidth: stageW, refHeight: stageH } = getCanvasRefDimensions(
      cfg.aspectRatio,
      cfg.orientation,
      cfg.customWidth,
      cfg.customHeight
    );
    const targetMode = idsToAlign.length === 1 ? 'canvas' : 'selection';
    const updatedLayers = alignSelectedLayers(
      textLayers,
      idsToAlign,
      alignment,
      stageW,
      stageH,
      targetMode
    );
    onUpdateDocument({ textLayers: updatedLayers });
    pushHistory(doc.content, updatedLayers, doc.spans || [], `Aligned layers: ${alignment}`, 'layer_align');
  };

  const handleDeleteSelectedLayers = (idsToDelete: string[]) => {
    const { updatedLayers, nextActiveId } = deleteSelectedLayers(textLayers, idsToDelete);
    setActiveLayerId(nextActiveId);
    setSelectedLayerIds(nextActiveId ? [nextActiveId] : []);
    const activeL = updatedLayers.find((l) => l.id === nextActiveId);
    if (activeL) {
      setActiveFormatting(activeL.style);
    }
    onUpdateDocument({
      textLayers: updatedLayers,
      activeLayerId: nextActiveId,
      content: activeL ? activeL.text : '',
    });
    pushHistory(
      activeL ? activeL.text : '',
      updatedLayers,
      doc.spans || [],
      `Deleted ${idsToDelete.length} selected layer(s)`,
      'layer_delete'
    );
  };

  const handleUpdateMultipleLayers = (updated: TextLayer[]) => {
    const updatedMap = new Map(updated.map((l) => [l.id, l]));
    const nextLayers = textLayers.map((l) => updatedMap.get(l.id) || l);
    onUpdateDocument({ textLayers: nextLayers });
  };

  const handleSelectAllLayers = () => {
    const allIds = textLayers.map((l) => l.id);
    setSelectedLayerIds(allIds);
  };

  const handleClearSelection = () => {
    setSelectedLayerIds([]);
  };

  const handleUpdateLayer = (layerId: string, updates: Partial<TextLayer>) => {
    const updatedLayers = updateLayersCollection(textLayers, layerId, updates, selectedLayerIds);
    const isCurrentActive = layerId === activeLayerId;
    onUpdateDocument({
      textLayers: updatedLayers,
      content: isCurrentActive && updates.text !== undefined ? updates.text : doc.content,
    });
  };

  // Open Native Input Text Editing for a Layer (Switches to Input Text Tab)
  const handleEditInNativeInput = (layer: TextLayer) => {
    setActiveLayerId(layer.id);
    setActiveFormatting(layer.style);
    onUpdateDocument({
      activeLayerId: layer.id,
      content: layer.text,
    });
    setActiveTab('input_text');
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus({ preventScroll: true });
      }
    }, 50);
  };

  // Add New Text Layer
  const handleAddTextLayer = () => {
    const newLayerId = `layer-${Date.now()}`;
    const maxZ = Math.max(0, ...textLayers.map((l) => l.zIndex ?? 0));
    const newLayer: TextLayer = {
      id: newLayerId,
      name: `Layer ${textLayers.length + 1}`,
      type: 'text',
      text: 'ازکیا چھُ تُہنْدس دماغس منْز',
      x: 60 + (textLayers.length % 4) * 20,
      y: 100 + (textLayers.length % 4) * 35,
      width: 440,
      height: 140,
      rotation: 0,
      scale: 1,
      opacity: 1,
      zIndex: maxZ + 1,
      isLocked: false,
      isHidden: false,
      style: { ...(doc.defaultStyle || DEFAULT_TEXT_STYLE), fontSize: 32 },
    };

    const updatedLayers = [...textLayers, newLayer];
    setActiveLayerId(newLayerId);
    setActiveFormatting(newLayer.style);
    onUpdateDocument({
      textLayers: updatedLayers,
      activeLayerId: newLayerId,
      content: newLayer.text,
    });
    pushHistory(newLayer.text, updatedLayers, doc.spans || [], `Added "${newLayer.name}"`, 'layer_add', {
      layerId: newLayerId,
    });

    // Switch to Input Text tab to immediately allow writing
    setActiveTab('input_text');
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus({ preventScroll: true });
      }
    }, 50);
  };

  const handleDuplicateLayer = (layerId: string) => {
    const source = textLayers.find((l) => l.id === layerId);
    if (!source) return;

    const newLayerId = `layer-${Date.now()}`;
    const maxZ = Math.max(0, ...textLayers.map((l) => l.zIndex ?? 0));
    const cloned = duplicateTextLayer(source, newLayerId, maxZ);

    const updatedLayers = [...textLayers, cloned];
    setActiveLayerId(newLayerId);
    onUpdateDocument({
      textLayers: updatedLayers,
      activeLayerId: newLayerId,
      content: cloned.text,
    });
    pushHistory(cloned.text, updatedLayers, doc.spans || [], `Duplicated "${source.name}"`, 'layer_duplicate', {
      layerId: newLayerId,
    });
  };

  const handleDeleteLayer = (layerId: string) => {
    const layerToDelete = textLayers.find((l) => l.id === layerId);
    if (textLayers.length <= 1) {
      handleUpdateLayer(layerId, { text: '' });
      return;
    }
    const updatedLayers = textLayers.filter((l) => l.id !== layerId);
    const nextActive = updatedLayers[0]?.id || '';
    setActiveLayerId(nextActive);
    setSelectedLayerIds((prev) => prev.filter((id) => id !== layerId));
    const nextLayer = updatedLayers[0];
    onUpdateDocument({
      textLayers: updatedLayers,
      activeLayerId: nextActive,
      content: nextLayer ? nextLayer.text : '',
    });
    pushHistory(
      nextLayer ? nextLayer.text : '',
      updatedLayers,
      doc.spans || [],
      `Deleted layer "${layerToDelete?.name || 'Layer'}"`,
      'layer_delete'
    );
  };

  const handleBringToFront = (layerId: string) => {
    const maxZ = Math.max(0, ...textLayers.map((l) => l.zIndex ?? 0));
    const layer = textLayers.find((l) => l.id === layerId);
    handleUpdateLayer(layerId, { zIndex: maxZ + 1 });
    const updatedLayers = textLayers.map((l) => (l.id === layerId ? { ...l, zIndex: maxZ + 1 } : l));
    pushHistory(doc.content, updatedLayers, doc.spans || [], `Brought "${layer?.name || 'Layer'}" to front`, 'layer_order');
  };

  const handleSendToBack = (layerId: string) => {
    const minZ = Math.min(1, ...textLayers.map((l) => l.zIndex ?? 0));
    const layer = textLayers.find((l) => l.id === layerId);
    const newZ = Math.max(0, minZ - 1);
    handleUpdateLayer(layerId, { zIndex: newZ });
    const updatedLayers = textLayers.map((l) => (l.id === layerId ? { ...l, zIndex: newZ } : l));
    pushHistory(doc.content, updatedLayers, doc.spans || [], `Sent "${layer?.name || 'Layer'}" to back`, 'layer_order');
  };

  const handleMoveLayerUp = (layerId: string) => {
    const layer = textLayers.find((l) => l.id === layerId);
    if (!layer) return;
    const newZ = (layer.zIndex ?? 0) + 1;
    handleUpdateLayer(layerId, { zIndex: newZ });
    const updatedLayers = textLayers.map((l) => (l.id === layerId ? { ...l, zIndex: newZ } : l));
    pushHistory(doc.content, updatedLayers, doc.spans || [], `Moved "${layer.name}" up`, 'layer_order');
  };

  const handleMoveLayerDown = (layerId: string) => {
    const layer = textLayers.find((l) => l.id === layerId);
    if (!layer) return;
    const newZ = Math.max(0, (layer.zIndex ?? 0) - 1);
    handleUpdateLayer(layerId, { zIndex: newZ });
    const updatedLayers = textLayers.map((l) => (l.id === layerId ? { ...l, zIndex: newZ } : l));
    pushHistory(doc.content, updatedLayers, doc.spans || [], `Moved "${layer.name}" down`, 'layer_order');
  };

  const handleCenterLayerHorizontally = (layerId: string) => {
    const targetLayer = textLayers.find((l) => l.id === layerId);
    if (!targetLayer) return;
    const layerEl = document.getElementById(`canvas-text-layer-${layerId}`);
    const actualWidth = layerEl ? layerEl.offsetWidth : (targetLayer.width || 240);
    const centeredX = Math.round((refWidth - actualWidth) / 2);
    handleUpdateLayer(layerId, { x: centeredX });
    const updatedLayers = textLayers.map((l) => (l.id === layerId ? { ...l, x: centeredX } : l));
    pushHistory(doc.content, updatedLayers, doc.spans || [], `Centered "${targetLayer.name}" horizontally`, 'layer_align');
  };

  const handleCenterLayerVertically = (layerId: string) => {
    const targetLayer = textLayers.find((l) => l.id === layerId);
    if (!targetLayer) return;
    const layerEl = document.getElementById(`canvas-text-layer-${layerId}`);
    const actualHeight = layerEl ? layerEl.offsetHeight : (targetLayer.height || 80);
    const centeredY = Math.round((refHeight - actualHeight) / 2);
    handleUpdateLayer(layerId, { y: centeredY });
    const updatedLayers = textLayers.map((l) => (l.id === layerId ? { ...l, y: centeredY } : l));
    pushHistory(doc.content, updatedLayers, doc.spans || [], `Centered "${targetLayer.name}" vertically`, 'layer_align');
  };

  const handleLayerTransformEnd = useCallback(
    (layerId: string, actionType: 'move' | 'rotate' | 'resize') => {
      const layer = textLayers.find((l) => l.id === layerId);
      const layerName = layer?.name || 'Layer';
      const actionDesc =
        actionType === 'move'
          ? `Moved ${layerName}`
          : actionType === 'rotate'
          ? `Rotated ${layerName}`
          : `Resized ${layerName}`;

      pushHistory(
        doc.content,
        textLayers,
        doc.spans || [],
        actionDesc,
        'layer_transform',
        { actionDetails: actionType, layerId }
      );
    },
    [textLayers, doc.content, doc.spans, pushHistory]
  );

  // Deselect active layer when clicking outside on the canvas stage or sheet background
  const handleDeselectLayerOnStageClick = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (
      !target.closest('[data-layer-id]') &&
      !target.closest('#mobile-text-design-toolbar-container') &&
      !target.closest('[data-export-exclude]') &&
      !target.closest('button') &&
      !target.closest('input') &&
      !target.closest('select')
    ) {
      setActiveLayerId(null);
    }
  }, []);

  // Dragging Mid-line & Magnet Snapping Guide State
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [snapSensitivity, setSnapSensitivity] = useState<number>(8);
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([]);
  const lastSnapSoundTimeRef = useRef<number>(0);

  const [activeDragInfo, setActiveDragInfo] = useState<{
    isDragging: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
  }>({
    isDragging: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const handleSnapPosition = useCallback(
    (
      layerId: string,
      rawX: number,
      rawY: number,
      width: number,
      height: number
    ) => {
      const cfg = doc.canvasConfig || {
        aspectRatio: 'auto',
        color: '#ffffff',
      };
      const { refWidth: stageW, refHeight: stageH } = getCanvasRefDimensions(
        cfg.aspectRatio,
        cfg.orientation,
        cfg.customWidth,
        cfg.customHeight
      );

      const result = calculateSnapping(
        layerId,
        rawX,
        rawY,
        width,
        height,
        stageW,
        stageH,
        textLayers,
        snapEnabled,
        snapSensitivity
      );

      setActiveGuides(result.activeGuides);

      // Play subtle acoustic click on snap lock
      if ((result.isSnappedX || result.isSnappedY) && soundEnabled) {
        const now = Date.now();
        if (now - lastSnapSoundTimeRef.current > 150) {
          lastSnapSoundTimeRef.current = now;
          playSnapSound(soundEnabled);
        }
      }

      return {
        snappedX: result.snappedX,
        snappedY: result.snappedY,
        isSnappedX: result.isSnappedX,
        isSnappedY: result.isSnappedY,
      };
    },
    [doc.canvasConfig, textLayers, snapEnabled, snapSensitivity, soundEnabled]
  );

  const handleLayerDragStateChange = useCallback(
    (isDragging: boolean, layerX: number, layerY: number, layerWidth: number, layerHeight: number) => {
      setActiveDragInfo({
        isDragging,
        x: layerX,
        y: layerY,
        width: layerWidth,
        height: layerHeight,
      });
      if (!isDragging) {
        setActiveGuides([]);
      }
    },
    []
  );

  // Quick Action Handlers for Input Text Mode
  const handleCopyAllText = useCallback(async () => {
    if (!doc.content) return;
    try {
      await navigator.clipboard.writeText(doc.content);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2200);
    } catch (e) {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2200);
    }
  }, [doc.content]);

  const handlePasteClipboardText = useCallback(async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        handleInsertText(clipText);
      }
    } catch (e) {
      textareaRef.current?.focus({ preventScroll: true });
    }
  }, [handleInsertText]);

  const handleClearAllText = useCallback(() => {
    if (!doc.content) return;
    const updatedLayers = textLayers.map((layer) => {
      if (layer.id === activeLayerId) {
        return { ...layer, text: '' };
      }
      return layer;
    });
    onUpdateDocument({
      content: '',
      spans: [],
      textLayers: updatedLayers,
    });
    pushHistory('', updatedLayers, [], 'Cleared all text', 'text_clear', {
      layerId: activeLayerId || undefined,
    });
    setCursorPos(0);
    setSelection({ start: 0, end: 0, text: '' });
    setTimeout(() => {
      textareaRef.current?.focus({ preventScroll: true });
    }, 20);
  }, [doc.content, textLayers, activeLayerId, onUpdateDocument, pushHistory]);

  // Visual Viewport tracking for Android Keyboard
  const { isKeyboardOpen, keyboardHeight } = useVisualViewport();

  // Zoom & Pan state for Canvas Stage
  const [zoomScale, setZoomScale] = useState<number>(1);
  const touchStartDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistRef.current = Math.hypot(dx, dy);
      initialZoomRef.current = zoomScale;
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const factor = currentDist / touchStartDistRef.current;
      const nextScale = Math.min(2.5, Math.max(0.5, initialZoomRef.current * factor));
      setZoomScale(parseFloat(nextScale.toFixed(2)));
    }
  };

  const handleCanvasTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  // Canvas Config & Aspect Ratio
  const canvasConfig: CanvasBackgroundConfig = doc.canvasConfig || {
    aspectRatio: 'auto',
    color: '#ffffff',
    imageOpacity: 1,
    overlayOpacity: 0,
  };

  const handleUpdateCanvasConfig = useCallback(
    (updates: Partial<CanvasBackgroundConfig>) => {
      const currentConfig = doc.canvasConfig || {
        aspectRatio: 'auto',
        color: '#ffffff',
        imageOpacity: 1,
        overlayOpacity: 0,
      };
      const nextConfig = { ...currentConfig, ...updates };
      onUpdateDocument({
        canvasConfig: nextConfig,
      });
      const desc = updates.aspectRatio
        ? `Canvas ratio: ${updates.aspectRatio}`
        : updates.color
        ? 'Canvas background color'
        : updates.image
        ? 'Canvas background image'
        : 'Updated canvas settings';
      pushHistory(doc.content, textLayers, doc.spans || [], desc, 'canvas_setup', undefined, nextConfig);
    },
    [doc.canvasConfig, doc.content, textLayers, doc.spans, onUpdateDocument, pushHistory]
  );

  const stageViewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: 600,
    height: 600,
  });

  useEffect(() => {
    if (!stageViewportRef.current) return;
    const el = stageViewportRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect && entry.contentRect.width > 0) {
          setViewportSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTab]);

  const { refWidth, refHeight } = getCanvasRefDimensions(
    canvasConfig.aspectRatio,
    canvasConfig.orientation,
    canvasConfig.customWidth,
    canvasConfig.customHeight
  );

  const availW = Math.max(280, viewportSize.width - 16);
  const availH = Math.max(260, viewportSize.height - 12);
  const autoFitScale = Math.min(1.0, availW / refWidth, availH / refHeight);
  const totalScale = parseFloat((autoFitScale * zoomScale).toFixed(3));

  return (
    <div className="relative flex flex-col w-full h-full min-h-0 bg-[#f4f3ee] overflow-hidden font-sans select-none">
      {/* 1. TOP MOBILE TWO-TAB NAVIGATION BAR */}
      <div className="w-full bg-white border-b border-stone-300 shadow-2xs z-30 flex flex-col shrink-0">
        <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 gap-2 overflow-x-auto custom-scrollbar">
          {/* Main Two-Tab Switcher: [Input Text] | [Canvas] */}
          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg shrink-0 border border-stone-300">
            <button
              id="tab-input-text"
              type="button"
              onClick={() => {
                setActiveTab('input_text');
                setTimeout(() => textareaRef.current?.focus(), 50);
              }}
              className={`w-9 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'input_text'
                  ? 'bg-emerald-700 text-white shadow-xs border border-emerald-800'
                  : 'text-stone-700 hover:text-black hover:bg-stone-200'
              }`}
              title="Input Text"
              aria-label="Input Text"
            >
              <Type size={16} />
            </button>

            <button
              id="tab-canvas"
              type="button"
              onClick={() => setActiveTab('canvas')}
              className={`w-9 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'canvas'
                  ? 'bg-emerald-700 text-white shadow-xs border border-emerald-800'
                  : 'text-stone-700 hover:text-black hover:bg-stone-200'
              }`}
              title="Canvas Stage"
              aria-label="Canvas Stage"
            >
              <Layout size={16} />
            </button>
          </div>

          {/* Center: Context Actions depending on Tab */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Add Text Button (available in both tabs) */}
            <button
              id="btn-add-text-layer-primary"
              type="button"
              onClick={handleAddTextLayer}
              className="w-9 h-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white flex items-center justify-center shadow-xs transition-all active:scale-95 cursor-pointer border border-emerald-800"
              title="Add Text Layer"
              aria-label="Add Text Layer"
            >
              <Plus size={16} />
            </button>

            {/* Canvas-only tools: Layers Manager & Canvas Settings */}
            {activeTab === 'canvas' && (
              <>
                <button
                  id="btn-toggle-layers-panel"
                  type="button"
                  onClick={() => setShowLayersPanel(!showLayersPanel)}
                  className={`relative w-9 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    showLayersPanel
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-600 shadow-2xs'
                      : 'bg-stone-100 text-stone-900 border-stone-300 hover:bg-stone-200'
                  }`}
                  title="Layers Manager"
                  aria-label="Layers"
                >
                  <Layers size={16} className={showLayersPanel ? 'text-emerald-900' : 'text-stone-800'} />
                  {textLayers.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-700 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-xs">
                      {textLayers.length}
                    </span>
                  )}
                </button>

                <button
                  id="btn-toggle-canvas-settings"
                  type="button"
                  onClick={() => setShowCanvasPanel(!showCanvasPanel)}
                  className={`w-9 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    showCanvasPanel
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-600 shadow-2xs'
                      : 'bg-stone-100 text-stone-900 border-stone-300 hover:bg-stone-200'
                  }`}
                  title="Canvas Settings"
                  aria-label="Canvas Settings"
                >
                  <Settings size={16} className={showCanvasPanel ? 'text-emerald-900' : 'text-stone-800'} />
                </button>

                <button
                  id="btn-toggle-snap-guides"
                  type="button"
                  onClick={() => setSnapEnabled(!snapEnabled)}
                  className={`relative w-9 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    snapEnabled
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                      : 'bg-stone-100 text-stone-900 border-stone-300 hover:bg-stone-200'
                  }`}
                  title={snapEnabled ? 'Magnet Snap: ON' : 'Magnet Snap: OFF'}
                  aria-label="Toggle Magnet Snap"
                >
                  <Magnet size={16} />
                  {snapEnabled && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border border-emerald-800 rounded-full shadow-2xs" />
                  )}
                </button>
              </>
            )}

            {/* Input Text-only tools: Layer Switcher Dropdown if multi-layer */}
            {activeTab === 'input_text' && textLayers.length > 1 && (
              <div className="flex items-center gap-1 bg-stone-100 border border-stone-300 px-2 py-0.5 rounded-lg text-xs" dir="ltr">
                <Layers size={13} className="text-stone-600" />
                <select
                  value={activeLayerId || ''}
                  onChange={(e) => handleSelectLayer(e.target.value)}
                  className="bg-transparent font-sans text-emerald-900 font-bold outline-none cursor-pointer text-xs"
                  title="Select Layer"
                >
                  {textLayers.map((l, idx) => (
                    <option key={l.id} value={l.id}>
                      {l.name && !l.name.includes('متن') ? l.name : `Layer ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right: Undo / Redo & Batch History */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndexRef.current <= 0}
              className="w-8.5 h-8 flex items-center justify-center rounded-lg bg-stone-100 border border-stone-300 text-stone-900 hover:text-black hover:bg-stone-200 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <RotateCcw size={15} />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndexRef.current >= historyRef.current.length - 1}
              className="w-8.5 h-8 flex items-center justify-center rounded-lg bg-stone-100 border border-stone-300 text-stone-900 hover:text-black hover:bg-stone-200 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              title="Redo (Ctrl+Y)"
              aria-label="Redo"
            >
              <RotateCw size={15} />
            </button>
            <button
              id="btn-open-batch-history-modal"
              type="button"
              onClick={() => setIsBatchHistoryModalOpen(true)}
              className="h-8 px-2 flex items-center justify-center gap-1.5 rounded-lg bg-stone-100 border border-stone-300 text-stone-900 hover:text-emerald-950 hover:bg-emerald-100/70 hover:border-emerald-400 transition-all cursor-pointer text-xs font-semibold"
              title="Action History & Batch Revert (Ctrl+H)"
              aria-label="History and Batch Revert"
            >
              <History size={14} className="text-emerald-800" />
              <span className="text-[10px] font-mono font-bold text-stone-700">
                {historyIndexRef.current + 1}/{historyRef.current.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Layers Manager Floating Drawer */}
      <LayerManagerPanel
        layers={textLayers}
        activeLayerId={activeLayerId}
        selectedLayerIds={selectedLayerIds}
        onSelectLayer={(id, isMulti) => {
          handleSelectLayer(id, isMulti);
        }}
        onToggleSelectLayer={handleToggleSelectLayer}
        onGroupLayers={handleGroupLayers}
        onUngroupLayers={handleUngroupLayers}
        onAddTextLayer={handleAddTextLayer}
        onUpdateLayer={handleUpdateLayer}
        onDuplicateLayer={handleDuplicateLayer}
        onDeleteLayer={handleDeleteLayer}
        onMoveLayerUp={handleMoveLayerUp}
        onMoveLayerDown={handleMoveLayerDown}
        isOpen={showLayersPanel}
        onClose={() => setShowLayersPanel(false)}
      />

      {/* Canvas Settings Bottom Sheet */}
      <CanvasSettingsPanel
        isOpen={showCanvasPanel}
        canvasConfig={canvasConfig}
        onUpdateCanvasConfig={handleUpdateCanvasConfig}
        onClose={() => setShowCanvasPanel(false)}
      />

      {/* Batch Undo/Redo & History Timeline Modal */}
      <BatchHistoryModal
        isOpen={isBatchHistoryModalOpen}
        onClose={() => setIsBatchHistoryModalOpen(false)}
        snapshots={historyRef.current}
        currentIndex={historyIndexRef.current}
        canUndo={historyIndexRef.current > 0}
        canRedo={historyIndexRef.current < historyRef.current.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onBatchUndo={handleBatchUndo}
        onBatchRedo={handleBatchRedo}
        onJumpToSnapshot={handleJumpToSnapshot}
        onRevertToInitial={handleRevertToInitial}
      />

      {/* ========================================================================= */}
      {/* 2. TAB 1: INPUT TEXT (Text Input Area and Keyboard Options ONLY) */}
      {/* ========================================================================= */}
      {activeTab === 'input_text' && (
        <div className="relative flex-1 w-full h-full min-h-0 flex flex-col bg-[#fbfaf8] overflow-hidden">
          {/* 1. Authoritative Native Text Input Area (Dominating, Scrollable, Clean UI) */}
          <div className="relative flex-1 w-full p-1.5 sm:p-2.5 overflow-hidden flex flex-col min-h-0">
            <div className="relative w-full h-full min-h-0 bg-white rounded-xl border border-stone-200 shadow-2xs p-3 sm:p-4 flex flex-col overflow-hidden transition-all focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/15">
              <textarea
                ref={textareaRef}
                id="kashmiri-authoritative-native-textarea"
                value={doc.content}
                onChange={handleNativeTextChange}
                onClick={updateSelectionFromDOM}
                onSelect={updateSelectionFromDOM}
                onKeyUp={updateSelectionFromDOM}
                dir={editorDirection}
                inputMode={activeKeyboard === 'system' ? 'text' : 'none'}
                placeholder="ازکیا چھُ تُہنْدس دماغس منْز..."
                className="w-full h-full bg-transparent text-stone-900 caret-emerald-700 resize-none border-none outline-hidden font-nastaliq font-normal cursor-text selection:bg-emerald-200/80 whitespace-pre-wrap break-words overflow-y-auto custom-scrollbar leading-[2.6] touch-pan-y overscroll-contain"
                style={{
                  fontFamily: getFontFamilyCSS(activeFormatting.fontFamily || 'Noto Nastaliq Urdu'),
                  fontSize: `${Math.max(8, Math.min(100, activeFormatting.fontSize || 22))}px`,
                  lineHeight: activeFormatting.lineHeight || 2.4,
                  letterSpacing: `${activeFormatting.letterSpacing || 0}px`,
                  textAlign: activeFormatting.align || 'right',
                  fontWeight: activeFormatting.bold ? 600 : 400,
                  fontStyle: activeFormatting.italic ? 'italic' : 'normal',
                  textDecoration: activeFormatting.underline ? 'underline' : 'none',
                }}
                autoFocus={activeKeyboard === 'system'}
              />
            </div>
          </div>

          {/* 2. Balanced Minimalist Text Input Controls Bar (Size Control, LTR/RTL, Keyboard Switcher) */}
          <div
            id="text-input-tab-control-bar"
            className="w-full bg-[#f4f2ed] border-t border-stone-300 px-3 py-1.5 flex items-center justify-between gap-2 shrink-0 select-none"
            dir="ltr"
          >
            {/* Left: Size Control (Minimalist Stepper) */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-stone-200/90 p-0.5 rounded-xl border border-stone-300 shadow-2xs">
                <button
                  type="button"
                  id="btn-decrease-text-size"
                  onClick={() => {
                    const currentSize = activeFormatting.fontSize || 22;
                    const newSize = Math.max(12, currentSize - 2);
                    handleUpdateStyle({ fontSize: newSize });
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-700 hover:text-black hover:bg-stone-300 active:scale-95 transition-all cursor-pointer"
                  title="Decrease Font Size"
                  aria-label="Decrease Font Size"
                >
                  <Minus size={14} />
                </button>

                <span
                  className="px-2 font-sans font-bold text-xs text-stone-800 tabular-nums select-none min-w-[38px] text-center"
                  title="Font Size"
                >
                  {activeFormatting.fontSize || 22}px
                </span>

                <button
                  type="button"
                  id="btn-increase-text-size"
                  onClick={() => {
                    const currentSize = activeFormatting.fontSize || 22;
                    const newSize = Math.min(96, currentSize + 2);
                    handleUpdateStyle({ fontSize: newSize });
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-700 hover:text-black hover:bg-stone-300 active:scale-95 transition-all cursor-pointer"
                  title="Increase Font Size"
                  aria-label="Increase Font Size"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Right: LTR / RTL Direction Switcher & Keyboard Selector */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* LTR / RTL Segmented Option */}
              <div className="flex items-center bg-stone-200/90 p-0.5 rounded-xl border border-stone-300 shadow-2xs" dir="ltr">
                <button
                  type="button"
                  id="btn-direction-rtl"
                  onClick={() => {
                    setEditorDirection('rtl');
                    handleUpdateStyle({ direction: 'rtl', align: 'right' });
                  }}
                  className={`px-2.5 h-7 rounded-lg flex items-center gap-1 font-sans text-xs font-bold transition-all cursor-pointer ${
                    editorDirection === 'rtl'
                      ? 'bg-emerald-700 text-white shadow-xs border border-emerald-800'
                      : 'text-stone-700 hover:text-black hover:bg-stone-300'
                  }`}
                  title="Right to Left (RTL)"
                  aria-label="Right to Left"
                >
                  <AlignRight size={13} />
                  <span>RTL</span>
                </button>

                <button
                  type="button"
                  id="btn-direction-ltr"
                  onClick={() => {
                    setEditorDirection('ltr');
                    handleUpdateStyle({ direction: 'ltr', align: 'left' });
                  }}
                  className={`px-2.5 h-7 rounded-lg flex items-center gap-1 font-sans text-xs font-bold transition-all cursor-pointer ${
                    editorDirection === 'ltr'
                      ? 'bg-emerald-700 text-white shadow-xs border border-emerald-800'
                      : 'text-stone-700 hover:text-black hover:bg-stone-300'
                  }`}
                  title="Left to Right (LTR)"
                  aria-label="Left to Right"
                >
                  <span>LTR</span>
                  <AlignLeft size={13} />
                </button>
              </div>

              {/* Segment Selector for System vs Kashmiri Keyboard */}
              <div className="flex items-center gap-0.5 bg-stone-200/90 p-0.5 rounded-xl border border-stone-300 shadow-2xs" dir="ltr">
                <button
                  type="button"
                  id="btn-select-system-keyboard"
                  onClick={() => {
                    setActiveKeyboard('system');
                    setTimeout(() => {
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                      }
                    }, 50);
                  }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    activeKeyboard === 'system'
                      ? 'bg-emerald-700 text-white shadow-xs border border-emerald-800'
                      : 'text-stone-700 hover:text-black hover:bg-stone-300'
                  }`}
                  title="System Keyboard"
                  aria-label="System Keyboard"
                >
                  <Type size={14} />
                </button>

                <button
                  type="button"
                  id="btn-select-kashmiri-keyboard"
                  onClick={() => {
                    setActiveKeyboard('kashmiri');
                    setTimeout(() => {
                      if (textareaRef.current) {
                        textareaRef.current.focus({ preventScroll: true });
                      }
                    }, 50);
                  }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    activeKeyboard === 'kashmiri'
                      ? 'bg-emerald-700 text-white shadow-xs border border-emerald-800'
                      : 'text-stone-700 hover:text-black hover:bg-stone-300'
                  }`}
                  title="Kashmiri Custom Keyboard"
                  aria-label="Kashmiri Custom Keyboard"
                >
                  <Keyboard size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Dedicated Docked Kashmiri Keyboard Area in Real Space */}
          {activeKeyboard === 'kashmiri' && (
            <div className="w-full shrink-0 z-40 shadow-xl border-t border-stone-300">
              <KashmiriKeyboard
                onInsertChar={handleInsertText}
                onBackspace={handleKeyboardBackspace}
                onEnter={handleKeyboardEnter}
                onSpace={handleKeyboardSpace}
                soundEnabled={soundEnabled}
                onToggleSound={onToggleSound}
                onCloseKeyboard={() => {
                  setActiveKeyboard('none');
                  if (textareaRef.current) {
                    textareaRef.current.blur();
                  }
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB 2: CANVAS (Maximum Available Design Space + Design Toolbar) */}
      {/* ========================================================================= */}
      {activeTab === 'canvas' && (
        <div className="relative flex-1 w-full h-full min-h-0 flex flex-col overflow-hidden">
          {/* Main Visual Canvas Stage */}
          <div
            ref={stageViewportRef}
            className="relative flex-1 w-full h-full min-h-0 flex flex-col items-center justify-center p-1 sm:p-2.5 overflow-auto custom-scrollbar bg-stone-200/50 cursor-default touch-pan-x touch-pan-y overscroll-contain"
            onPointerDown={handleDeselectLayerOnStageClick}
            onTouchStart={handleCanvasTouchStart}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={handleCanvasTouchEnd}
          >
            {/* Scaled Layout Wrapper */}
            <div
              className="relative flex items-center justify-center my-auto transition-all duration-75"
              style={{
                width: `${Math.round(refWidth * totalScale)}px`,
                height: `${Math.round(refHeight * totalScale)}px`,
              }}
            >
              {/* Canvas Stage Sheet */}
              <div
                id="kashmiri-canvas-document-sheet"
                data-canvas-stage="true"
                onPointerDown={handleDeselectLayerOnStageClick}
                className="absolute bg-white shadow-xl rounded-2xl border border-stone-300 overflow-hidden select-none flex flex-col transition-transform duration-75"
                style={{
                  width: `${refWidth}px`,
                  height: `${refHeight}px`,
                  transform: `scale(${totalScale})`,
                  transformOrigin: 'center center',
                  backgroundColor: canvasConfig.color || '#ffffff',
                  backgroundImage: canvasConfig.image ? `url(${canvasConfig.image})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Background Overlay */}
                {canvasConfig.overlayOpacity && canvasConfig.overlayOpacity > 0 ? (
                  <div
                    className="absolute inset-0 pointer-events-none z-0"
                    style={{
                      backgroundColor: canvasConfig.overlayColor || '#000000',
                      opacity: canvasConfig.overlayOpacity,
                    }}
                  />
                ) : null}

                {/* Dynamic Alignment Guidelines (Vertical & Horizontal magnet lines) */}
                {activeDragInfo.isDragging && (activeGuides.length > 0 || snapEnabled) && (
                  <div className="absolute inset-0 pointer-events-none z-20 export-exclude" data-export-exclude="true">
                    {activeGuides.map((guide) => {
                      if (guide.type === 'vertical') {
                        const startY = guide.start !== undefined ? guide.start : 0;
                        const endY = guide.end !== undefined ? guide.end : refHeight;
                        const heightPx = Math.max(20, endY - startY);
                        return (
                          <div
                            key={guide.id}
                            className="absolute top-0 bottom-0 pointer-events-none transition-opacity duration-75"
                            style={{ left: `${guide.position}px` }}
                          >
                            <div
                              className={`absolute -translate-x-1/2 shadow-xs ${
                                guide.source === 'canvas'
                                  ? 'w-[2px] bg-emerald-600 shadow-emerald-500/50'
                                  : guide.source === 'margin'
                                  ? 'w-[1.5px] bg-amber-500 border-x border-amber-300/40'
                                  : 'w-[1.5px] bg-indigo-600 shadow-indigo-500/50'
                              }`}
                              style={{
                                top: `${startY}px`,
                                height: `${heightPx}px`,
                              }}
                            />
                            <div
                              className={`absolute -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white shadow-2xs ${
                                guide.source === 'canvas' ? 'bg-emerald-600' : guide.source === 'margin' ? 'bg-amber-600' : 'bg-indigo-600'
                              }`}
                              style={{ top: `${startY}px` }}
                            />
                            <div
                              className={`absolute -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white shadow-2xs ${
                                guide.source === 'canvas' ? 'bg-emerald-600' : guide.source === 'margin' ? 'bg-amber-600' : 'bg-indigo-600'
                              }`}
                              style={{ top: `${startY + heightPx}px` }}
                            />
                            <div
                              className={`absolute top-2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-sans font-bold text-white shadow-xs whitespace-nowrap ${
                                guide.source === 'canvas' ? 'bg-emerald-700' : guide.source === 'margin' ? 'bg-amber-700' : 'bg-indigo-700'
                              }`}
                            >
                              {guide.label}
                            </div>
                          </div>
                        );
                      } else {
                        const startX = guide.start !== undefined ? guide.start : 0;
                        const endX = guide.end !== undefined ? guide.end : refWidth;
                        const widthPx = Math.max(20, endX - startX);
                        return (
                          <div
                            key={guide.id}
                            className="absolute left-0 right-0 pointer-events-none transition-opacity duration-75"
                            style={{ top: `${guide.position}px` }}
                          >
                            <div
                              className={`absolute -translate-y-1/2 shadow-xs ${
                                guide.source === 'canvas'
                                  ? 'h-[2px] bg-emerald-600 shadow-emerald-500/50'
                                  : guide.source === 'margin'
                                  ? 'h-[1.5px] bg-amber-500 border-y border-amber-300/40'
                                  : 'h-[1.5px] bg-indigo-600 shadow-indigo-500/50'
                              }`}
                              style={{
                                left: `${startX}px`,
                                width: `${widthPx}px`,
                              }}
                            />
                            <div
                              className={`absolute -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white shadow-2xs ${
                                guide.source === 'canvas' ? 'bg-emerald-600' : guide.source === 'margin' ? 'bg-amber-600' : 'bg-indigo-600'
                              }`}
                              style={{ left: `${startX}px` }}
                            />
                            <div
                              className={`absolute -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white shadow-2xs ${
                                guide.source === 'canvas' ? 'bg-emerald-600' : guide.source === 'margin' ? 'bg-amber-600' : 'bg-indigo-600'
                              }`}
                              style={{ left: `${startX + widthPx}px` }}
                            />
                            <div
                              className={`absolute left-2 -translate-y-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-sans font-bold text-white shadow-xs whitespace-nowrap ${
                                guide.source === 'canvas' ? 'bg-emerald-700' : guide.source === 'margin' ? 'bg-amber-700' : 'bg-indigo-700'
                              }`}
                            >
                              {guide.label}
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}

                {/* Rendered Text Layers */}
                <div className="relative w-full h-full flex-1 z-10 overflow-hidden">
                  {textLayers.map((layer) => {
                    const isSelected = selectedLayerIds.includes(layer.id) || layer.id === activeLayerId;
                    const isPrimaryActive = layer.id === activeLayerId;
                    const isMultiSelecting = selectedLayerIds.length >= 2;
                    const canGroup = selectedLayerIds.length >= 2 && selectedLayerIds.includes(layer.id);
                    return (
                      <CanvasTextLayerObject
                        key={layer.id}
                        layer={layer}
                        isSelected={isSelected}
                        isPrimaryActive={isPrimaryActive}
                        isMultiSelecting={isMultiSelecting}
                        onSelect={handleSelectLayer}
                        onUpdateLayer={handleUpdateLayer}
                        onEditInNativeInput={handleEditInNativeInput}
                        onDuplicateLayer={handleDuplicateLayer}
                        onDeleteLayer={handleDeleteLayer}
                        onBringToFront={handleBringToFront}
                        onSendToBack={handleSendToBack}
                        onMoveUp={handleMoveLayerUp}
                        onMoveDown={handleMoveLayerDown}
                        canvasScale={totalScale}
                        canGroup={canGroup}
                        onGroupSelected={() => handleGroupLayers(selectedLayerIds)}
                        onUngroupSelected={() => layer.groupId && handleUngroupLayers(layer.groupId)}
                        onDragStateChange={handleLayerDragStateChange}
                        onTransformEnd={handleLayerTransformEnd}
                        onSnapPosition={handleSnapPosition}
                      />
                    );
                  })}

                  {/* Combined Union Bounding Box for Multi-Layer Selection */}
                  {selectedLayerIds.length >= 2 && (
                    <CombinedCanvasSelectionBox
                      selectedLayers={textLayers.filter((l) => selectedLayerIds.includes(l.id))}
                      onUpdateMultipleLayers={handleUpdateMultipleLayers}
                      onAlignLayers={handleAlignLayers}
                      canvasScale={totalScale}
                      onSnapPosition={handleSnapPosition}
                      onDragStateChange={handleLayerDragStateChange}
                    />
                  )}
                </div>

                {/* Minimal Brand Attribution */}
                <div className="w-full px-4 py-2 flex items-center justify-between text-[11px] text-stone-400 font-sans z-10 pointer-events-none select-none">
                  <span className="font-semibold text-stone-500">Kashur Kanvas</span>
                  <span>Kashmiri Calligraphy & Design Studio</span>
                </div>
              </div>
            </div>

            {/* Floating High-Contrast Zoom Control Pill */}
            <div className="fixed bottom-20 left-3 z-30 flex items-center gap-1 bg-white border-2 border-stone-300 rounded-full shadow-lg p-1">
              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.max(0.5, parseFloat((s - 0.1).toFixed(2))))}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-900 hover:bg-stone-200 active:scale-95 transition-all cursor-pointer"
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>

              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="px-2.5 py-1 text-xs font-mono font-bold text-stone-900 hover:bg-stone-200 rounded-full transition-all cursor-pointer"
                title="Reset Zoom (100%)"
                aria-label="Reset Zoom"
              >
                {Math.round(zoomScale * 100)}%
              </button>

              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.min(2.5, parseFloat((s + 0.1).toFixed(2))))}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-900 hover:bg-stone-200 active:scale-95 transition-all cursor-pointer"
                title="Zoom In"
                aria-label="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
            </div>
          </div>

          {/* Bottom Canvas Design Toolbar */}
          <MobileTextDesignToolbar
            activeLayer={activeLayer}
            currentStyle={activeFormatting}
            onUpdateStyle={handleUpdateStyle}
            onOpenUnicodeEditor={() => {
              if (activeLayer) {
                handleEditInNativeInput(activeLayer);
              } else {
                handleAddTextLayer();
              }
            }}
            onAddNewText={handleAddTextLayer}
            onDuplicateLayer={handleDuplicateLayer}
            onDeleteLayer={handleDeleteLayer}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
            onOpenLayersPanel={() => setShowLayersPanel(true)}
            onOpenCanvasSettings={() => setShowCanvasPanel(true)}
            onCenterHorizontally={handleCenterLayerHorizontally}
            onCenterVertically={handleCenterLayerVertically}
            onAlignLayers={handleAlignLayers}
            selectedLayerIds={selectedLayerIds}
            snapEnabled={snapEnabled}
            onToggleSnap={setSnapEnabled}
            snapSensitivity={snapSensitivity}
            onChangeSnapSensitivity={setSnapSensitivity}
          />
        </div>
      )}

      {/* Slide-Up Layer Manager Panel */}
      <LayerManagerPanel
        isOpen={showLayersPanel}
        layers={textLayers}
        activeLayerId={activeLayerId}
        selectedLayerIds={selectedLayerIds}
        onSelectLayer={handleSelectLayer}
        onToggleSelectLayer={handleToggleSelectLayer}
        onSelectAllLayers={handleSelectAllLayers}
        onClearSelection={handleClearSelection}
        onGroupLayers={handleGroupLayers}
        onUngroupLayers={handleUngroupLayers}
        onMergeLayers={handleMergeLayers}
        onAlignLayers={handleAlignLayers}
        onDeleteSelectedLayers={handleDeleteSelectedLayers}
        onAddTextLayer={handleAddTextLayer}
        onUpdateLayer={handleUpdateLayer}
        onDeleteLayer={handleDeleteLayer}
        onDuplicateLayer={handleDuplicateLayer}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onMoveUp={handleMoveLayerUp}
        onMoveDown={handleMoveLayerDown}
        onClose={() => setShowLayersPanel(false)}
      />

      {/* Slide-Up Canvas Settings & Alignment Panel */}
      <CanvasSettingsPanel
        isOpen={showCanvasPanel}
        canvasConfig={canvasConfig}
        onUpdateCanvasConfig={handleUpdateCanvasConfig}
        onClose={() => setShowCanvasPanel(false)}
        snapEnabled={snapEnabled}
        onToggleSnap={setSnapEnabled}
        snapSensitivity={snapSensitivity}
        onChangeSnapSensitivity={setSnapSensitivity}
      />
    </div>
  );
};
