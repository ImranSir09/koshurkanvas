import {
  CanvasBackgroundConfig,
  HistoryActionCategory,
  HistorySnapshot,
  KashurDocument,
  TextStyleProperties,
  TextStyleSpan,
  TextLayer,
} from '../types';

/**
 * Deep clones arrays/objects for immutable history storage
 */
export function cloneLayers(layers: TextLayer[]): TextLayer[] {
  return layers.map((layer) => ({
    ...layer,
    style: { ...layer.style },
    spans: layer.spans ? layer.spans.map((s) => ({ ...s, style: { ...s.style } })) : undefined,
  }));
}

export function cloneSpans(spans: TextStyleSpan[]): TextStyleSpan[] {
  return spans.map((span) => ({
    ...span,
    style: { ...span.style },
  }));
}

export function cloneCanvasConfig(config?: CanvasBackgroundConfig): CanvasBackgroundConfig | undefined {
  if (!config) return undefined;
  return { ...config };
}

export function cloneStyle(style?: TextStyleProperties): TextStyleProperties | undefined {
  if (!style) return undefined;
  return { ...style };
}

/**
 * Creates a clean snapshot of document state for undo/redo history
 */
export function createHistorySnapshot(
  params: {
    description: string;
    category: HistoryActionCategory;
    content: string;
    textLayers: TextLayer[];
    spans: TextStyleSpan[];
    canvasConfig?: CanvasBackgroundConfig;
    defaultStyle?: TextStyleProperties;
    activeLayerId?: string | null;
    selectedLayerIds?: string[];
    docTitle?: string;
    meta?: HistorySnapshot['meta'];
  }
): HistorySnapshot {
  return {
    id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    description: params.description,
    category: params.category,
    docTitle: params.docTitle,
    content: params.content,
    textLayers: cloneLayers(params.textLayers),
    spans: cloneSpans(params.spans),
    canvasConfig: cloneCanvasConfig(params.canvasConfig),
    defaultStyle: cloneStyle(params.defaultStyle),
    activeLayerId: params.activeLayerId,
    selectedLayerIds: params.selectedLayerIds ? [...params.selectedLayerIds] : undefined,
    meta: params.meta,
  };
}

/**
 * Helper to build human-readable descriptions for text changes
 */
export function describeTextChange(
  previousContent: string,
  newContent: string,
  layerName?: string
): { description: string; category: HistoryActionCategory; meta?: HistorySnapshot['meta'] } {
  const target = layerName ? ` in ${layerName}` : '';
  if (!newContent && previousContent) {
    return {
      description: `Cleared text content${target}`,
      category: 'text_edit',
    };
  }

  const delta = newContent.length - previousContent.length;
  if (delta === 1) {
    const lastChar = newContent.slice(-1);
    return {
      description: `Typed character '${lastChar}'${target}`,
      category: 'text_edit',
    };
  }
  if (delta > 1) {
    return {
      description: `Inserted / pasted ${delta} characters${target}`,
      category: 'text_edit',
      meta: { actionDetails: `+${delta} chars` },
    };
  }
  if (delta < 0) {
    return {
      description: `Deleted ${Math.abs(delta)} character${Math.abs(delta) > 1 ? 's' : ''}${target}`,
      category: 'text_edit',
      meta: { actionDetails: `${delta} chars` },
    };
  }
  return {
    description: `Updated text content${target}`,
    category: 'text_edit',
  };
}

/**
 * Helper to build human-readable descriptions for style changes
 */
export function describeStyleChange(
  updates: Partial<TextStyleProperties>,
  affectedCount = 1
): { description: string; category: HistoryActionCategory; meta?: HistorySnapshot['meta'] } {
  const layerSuffix = affectedCount > 1 ? ` (${affectedCount} layers)` : '';

  if (updates.fontFamily) {
    return {
      description: `Changed font to ${updates.fontFamily}${layerSuffix}`,
      category: 'format_style',
      meta: { fontFamily: updates.fontFamily },
    };
  }
  if (updates.fontSize !== undefined) {
    return {
      description: `Set font size to ${updates.fontSize}px${layerSuffix}`,
      category: 'format_style',
      meta: { fontSize: updates.fontSize },
    };
  }
  if (updates.direction) {
    return {
      description: `Switched direction to ${updates.direction.toUpperCase()}${layerSuffix}`,
      category: 'format_style',
    };
  }
  if (updates.align) {
    return {
      description: `Aligned text ${updates.align}${layerSuffix}`,
      category: 'format_style',
    };
  }
  if (updates.color) {
    return {
      description: `Changed text color to ${updates.color}${layerSuffix}`,
      category: 'format_style',
    };
  }
  if (updates.bold !== undefined) {
    return {
      description: `${updates.bold ? 'Applied' : 'Removed'} bold formatting${layerSuffix}`,
      category: 'format_style',
    };
  }
  if (updates.italic !== undefined) {
    return {
      description: `${updates.italic ? 'Applied' : 'Removed'} italic formatting${layerSuffix}`,
      category: 'format_style',
    };
  }
  if (updates.underline !== undefined) {
    return {
      description: `${updates.underline ? 'Applied' : 'Removed'} underline${layerSuffix}`,
      category: 'format_style',
    };
  }
  if (updates.shadowColor || updates.shadowBlur !== undefined) {
    return {
      description: `Adjusted text shadow effect${layerSuffix}`,
      category: 'format_style',
    };
  }
  if (updates.strokeColor || updates.strokeWidth !== undefined) {
    return {
      description: `Adjusted text outline stroke${layerSuffix}`,
      category: 'format_style',
    };
  }
  if (updates.lineHeight !== undefined) {
    return {
      description: `Set line height to ${updates.lineHeight.toFixed(1)}${layerSuffix}`,
      category: 'format_style',
    };
  }
  if (updates.letterSpacing !== undefined) {
    return {
      description: `Set letter spacing to ${updates.letterSpacing}px${layerSuffix}`,
      category: 'format_style',
    };
  }

  return {
    description: `Updated typography styling${layerSuffix}`,
    category: 'format_style',
  };
}

/**
 * Format relative time (e.g., 'Just now', '1m ago', '3h ago')
 */
export function formatHistoryRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
