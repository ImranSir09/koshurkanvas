import {
  TextLayer,
  TextStyleSpan,
  TextStyleProperties,
  CanvasBackgroundConfig,
} from '../types';

export interface DocumentSnapshot {
  id: string;
  timestamp: number;
  actionName: string;
  content: string;
  textLayers: TextLayer[];
  spans: TextStyleSpan[];
  canvasConfig?: CanvasBackgroundConfig;
  defaultStyle?: TextStyleProperties;
  activeLayerId: string | null;
  selectedLayerIds: string[];
}

export function cloneTextLayers(layers?: TextLayer[]): TextLayer[] {
  if (!layers) return [];
  return layers.map((l) => ({
    ...l,
    style: { ...l.style },
    spans: l.spans ? l.spans.map((s) => ({ ...s, style: { ...s.style } })) : undefined,
  }));
}

export function cloneSpans(spans?: TextStyleSpan[]): TextStyleSpan[] {
  if (!spans) return [];
  return spans.map((s) => ({ ...s, style: { ...s.style } }));
}

export function cloneCanvasConfig(
  config?: CanvasBackgroundConfig
): CanvasBackgroundConfig | undefined {
  if (!config) return undefined;
  return { ...config };
}

export function cloneTextStyle(
  style?: TextStyleProperties
): TextStyleProperties | undefined {
  if (!style) return undefined;
  return { ...style };
}

export function createDocumentSnapshot(params: {
  actionName?: string;
  content: string;
  textLayers: TextLayer[];
  spans?: TextStyleSpan[];
  canvasConfig?: CanvasBackgroundConfig;
  defaultStyle?: TextStyleProperties;
  activeLayerId?: string | null;
  selectedLayerIds?: string[];
}): DocumentSnapshot {
  return {
    id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    actionName: params.actionName || 'Edit',
    content: params.content,
    textLayers: cloneTextLayers(params.textLayers),
    spans: cloneSpans(params.spans),
    canvasConfig: cloneCanvasConfig(params.canvasConfig),
    defaultStyle: cloneTextStyle(params.defaultStyle),
    activeLayerId: params.activeLayerId ?? null,
    selectedLayerIds: params.selectedLayerIds ? [...params.selectedLayerIds] : [],
  };
}

const MAX_HISTORY_STEPS = 60;

export class UndoRedoManager {
  private history: DocumentSnapshot[] = [];
  private currentIndex: number = -1;
  private lastActionTime: number = 0;
  private lastActionType: string = '';

  constructor(initialSnapshot?: DocumentSnapshot) {
    if (initialSnapshot) {
      this.history = [initialSnapshot];
      this.currentIndex = 0;
    }
  }

  public reset(initialSnapshot: DocumentSnapshot) {
    this.history = [initialSnapshot];
    this.currentIndex = 0;
    this.lastActionTime = 0;
    this.lastActionType = '';
  }

  public push(
    snapshot: DocumentSnapshot,
    options?: { debounceGroup?: string; debounceWindowMs?: number }
  ): boolean {
    const now = Date.now();
    const group = options?.debounceGroup;
    const windowMs = options?.debounceWindowMs ?? 700;

    // Check if this action can be merged with the top snapshot (e.g. continuous typing or sliding)
    if (
      group &&
      this.lastActionType === group &&
      now - this.lastActionTime < windowMs &&
      this.currentIndex >= 0 &&
      this.currentIndex === this.history.length - 1
    ) {
      // Overwrite the current top snapshot to avoid micro-steps
      this.history[this.currentIndex] = snapshot;
      this.lastActionTime = now;
      return false; // Did not add a new step, just updated
    }

    // Normal push: truncate future history if we are in the middle of the stack
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push(snapshot);
    if (this.history.length > MAX_HISTORY_STEPS) {
      this.history.shift();
    }
    this.currentIndex = this.history.length - 1;
    this.lastActionTime = now;
    this.lastActionType = group || snapshot.actionName;
    return true;
  }

  public canUndo(): boolean {
    return this.currentIndex > 0;
  }

  public canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  public undo(): DocumentSnapshot | null {
    if (!this.canUndo()) return null;
    this.currentIndex -= 1;
    return this.history[this.currentIndex];
  }

  public redo(): DocumentSnapshot | null {
    if (!this.canRedo()) return null;
    this.currentIndex += 1;
    return this.history[this.currentIndex];
  }

  public getCurrentSnapshot(): DocumentSnapshot | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return null;
  }

  public getStats() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      currentIndex: this.currentIndex,
      totalCount: this.history.length,
      currentAction: this.getCurrentSnapshot()?.actionName || '',
    };
  }
}
