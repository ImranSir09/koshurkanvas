import { TextLayer, TextStyleProperties } from '../types';

/**
 * Deep clones a TextLayer object including style and spans properties.
 * Guarantees reference isolation while preserving non-modified property identity.
 */
export function deepCloneLayer(layer: TextLayer, overrides?: Partial<TextLayer>): TextLayer {
  const clonedStyle: TextStyleProperties = {
    ...layer.style,
    ...(overrides?.style || {}),
  };

  const clonedSpans = overrides?.spans !== undefined
    ? (overrides.spans ? overrides.spans.map((s) => ({ ...s, style: { ...s.style } })) : undefined)
    : (layer.spans ? layer.spans.map((s) => ({ ...s, style: { ...s.style } })) : undefined);

  const merged: TextLayer = {
    ...layer,
    ...overrides,
    style: clonedStyle,
    spans: clonedSpans,
  };

  if (overrides && 'groupId' in overrides && overrides.groupId === undefined) {
    delete merged.groupId;
  }

  return merged;
}

/**
 * Groups selected layers using a reference-based system.
 * Untouched layers retain exact object identity (l === l) without redundant object duplication.
 */
export function groupSelectedLayers(
  layers: TextLayer[],
  idsToGroup: string[],
  customGroupId?: string
): TextLayer[] {
  if (!idsToGroup || idsToGroup.length < 2) return layers;

  const targetSet = new Set(idsToGroup);
  const newGroupId = customGroupId || `group-${Date.now()}`;

  return layers.map((layer) => {
    if (targetSet.has(layer.id)) {
      return deepCloneLayer(layer, { groupId: newGroupId });
    }
    return layer;
  });
}

/**
 * Ungroups layers matching a target group ID.
 * Preserves unchanged layer references while cleanly deleting groupId from target layers.
 */
export function ungroupSelectedLayers(
  layers: TextLayer[],
  targetGroupId: string
): TextLayer[] {
  if (!targetGroupId) return layers;

  return layers.map((layer) => {
    if (layer.groupId === targetGroupId) {
      return deepCloneLayer(layer, { groupId: undefined });
    }
    return layer;
  });
}

/**
 * Reference-based collection updater for text layers.
 * Handles single or group movement, style updates, and property changes without duplicating state objects.
 */
export function updateLayersCollection(
  layers: TextLayer[],
  targetLayerId: string,
  updates: Partial<TextLayer>,
  selectedLayerIds: string[] = []
): TextLayer[] {
  const targetLayer = layers.find((l) => l.id === targetLayerId);
  if (!targetLayer) return layers;

  const isMoving = updates.x !== undefined || updates.y !== undefined;
  let dx = 0;
  let dy = 0;

  if (isMoving) {
    dx = updates.x !== undefined ? updates.x - targetLayer.x : 0;
    dy = updates.y !== undefined ? updates.y - targetLayer.y : 0;
  }

  const affectedIds = new Set<string>();
  if (targetLayer.groupId) {
    layers.filter((l) => l.groupId === targetLayer.groupId).forEach((l) => affectedIds.add(l.id));
  } else if (selectedLayerIds.includes(targetLayerId) && selectedLayerIds.length > 1) {
    selectedLayerIds.forEach((id) => affectedIds.add(id));
  } else {
    affectedIds.add(targetLayerId);
  }

  return layers.map((l) => {
    if (l.id === targetLayerId) {
      return deepCloneLayer(l, updates);
    } else if (isMoving && affectedIds.has(l.id)) {
      return deepCloneLayer(l, {
        x: Math.round(l.x + dx),
        y: Math.round(l.y + dy),
      });
    }
    return l;
  });
}

/**
 * Applies style updates to specific layer IDs while maintaining reference purity for unaffected layers.
 */
export function applyStyleToLayers(
  layers: TextLayer[],
  targetLayerIds: string[],
  styleUpdates: Partial<TextStyleProperties>
): TextLayer[] {
  const targetSet = new Set(targetLayerIds);
  return layers.map((layer) => {
    if (targetSet.has(layer.id)) {
      return deepCloneLayer(layer, {
        style: { ...layer.style, ...styleUpdates },
      });
    }
    return layer;
  });
}

/**
 * Creates a deep-cloned duplicate of a text layer with offset coordinates and isolated state.
 */
export function duplicateTextLayer(
  sourceLayer: TextLayer,
  newId: string,
  maxZIndex: number
): TextLayer {
  const cloned = deepCloneLayer(sourceLayer, {
    id: newId,
    name: `${sourceLayer.name} (نقل)`,
    x: sourceLayer.x + 24,
    y: sourceLayer.y + 24,
    zIndex: maxZIndex + 1,
  });
  delete cloned.groupId;
  return cloned;
}

/**
 * Merges multiple selected text layers into a single editable text layer.
 * Joins Unicode text with linebreaks, offsets text spans accurately,
 * and positions the merged layer over the union bounding box.
 */
export function mergeSelectedLayers(
  layers: TextLayer[],
  idsToMerge: string[]
): { updatedLayers: TextLayer[]; mergedLayer: TextLayer } {
  if (!idsToMerge || idsToMerge.length < 2) {
    const single = layers.find((l) => idsToMerge.includes(l.id)) || layers[0];
    return { updatedLayers: layers, mergedLayer: single };
  }

  const targetSet = new Set(idsToMerge);
  const selected = layers
    .filter((l) => targetSet.has(l.id))
    .sort((a, b) => (a.y !== b.y ? a.y - b.y : (a.zIndex ?? 0) - (b.zIndex ?? 0)));

  if (selected.length === 0) {
    return { updatedLayers: layers, mergedLayer: layers[0] };
  }

  // Calculate union bounds
  const minX = Math.min(...selected.map((l) => l.x));
  const minY = Math.min(...selected.map((l) => l.y));
  const maxX = Math.max(...selected.map((l) => l.x + (l.width || 240)));
  const maxY = Math.max(...selected.map((l) => l.y + (l.height || 80)));
  const unionWidth = Math.max(160, maxX - minX);
  const unionHeight = Math.max(60, maxY - minY);
  const maxZ = Math.max(...selected.map((l) => l.zIndex ?? 0));

  // Merge content & spans
  let combinedText = '';
  const combinedSpans: TextStyleProperties extends any ? any[] : any[] = [];
  let currentOffset = 0;

  selected.forEach((layer, idx) => {
    const textPart = layer.text || '';
    if (idx > 0) {
      combinedText += '\n';
      currentOffset += 1;
    }
    const partStart = currentOffset;
    combinedText += textPart;

    if (layer.spans && layer.spans.length > 0) {
      layer.spans.forEach((span) => {
        combinedSpans.push({
          id: `span-merged-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          start: partStart + span.start,
          end: partStart + span.end,
          style: { ...span.style },
        });
      });
    }

    currentOffset += textPart.length;
  });

  const primaryStyle = selected[0]?.style || layers[0]?.style;
  const mergedId = `layer-merged-${Date.now()}`;

  const mergedLayer: TextLayer = {
    id: mergedId,
    name: `مدغم متن (${selected.length} لئیر)`,
    type: 'text',
    text: combinedText,
    x: minX,
    y: minY,
    width: unionWidth,
    height: unionHeight,
    rotation: 0,
    scale: 1,
    opacity: selected[0]?.opacity ?? 1,
    zIndex: maxZ,
    isLocked: false,
    isHidden: false,
    style: { ...primaryStyle },
    spans: combinedSpans.length > 0 ? combinedSpans : undefined,
  };

  // Replace merged layers in original list while maintaining order
  let replaced = false;
  const updatedLayers: TextLayer[] = [];

  for (const layer of layers) {
    if (targetSet.has(layer.id)) {
      if (!replaced) {
        updatedLayers.push(mergedLayer);
        replaced = true;
      }
    } else {
      updatedLayers.push(layer);
    }
  }

  if (!replaced) {
    updatedLayers.push(mergedLayer);
  }

  return { updatedLayers, mergedLayer };
}

export type LayerAlignmentType =
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'middle'
  | 'bottom'
  | 'distribute-h'
  | 'distribute-v';

/**
 * Aligns selected layers relative to their combined union bounding box or canvas bounds.
 */
export function alignSelectedLayers(
  layers: TextLayer[],
  idsToAlign: string[],
  alignment: LayerAlignmentType,
  canvasWidth?: number,
  canvasHeight?: number,
  targetMode: 'selection' | 'canvas' = 'selection'
): TextLayer[] {
  if (!idsToAlign || idsToAlign.length === 0) return layers;

  const targetSet = new Set(idsToAlign);
  const selected = layers.filter((l) => targetSet.has(l.id) && !l.isLocked);
  if (selected.length === 0) return layers;

  // If only 1 layer is selected OR targetMode is 'canvas', align relative to canvas bounds
  const useCanvasBounds = targetMode === 'canvas' || (selected.length === 1 && !!canvasWidth && !!canvasHeight);

  if (useCanvasBounds && canvasWidth && canvasHeight) {
    return layers.map((layer) => {
      if (!targetSet.has(layer.id) || layer.isLocked) return layer;

      const layerW = layer.width || 240;
      const layerH = layer.height || 80;

      let nextX = layer.x;
      let nextY = layer.y;

      switch (alignment) {
        case 'left':
          nextX = 24; // Align to margin/left edge
          break;
        case 'center':
          nextX = Math.round((canvasWidth - layerW) / 2);
          break;
        case 'right':
          nextX = Math.round(canvasWidth - layerW - 24);
          break;
        case 'top':
          nextY = 24;
          break;
        case 'middle':
          nextY = Math.round((canvasHeight - layerH) / 2);
          break;
        case 'bottom':
          nextY = Math.round(canvasHeight - layerH - 24);
          break;
        default:
          break;
      }

      return deepCloneLayer(layer, { x: nextX, y: nextY });
    });
  }

  // Multi-layer alignment relative to Selection Union Bounding Box
  if (selected.length < 2) return layers;

  const minX = Math.min(...selected.map((l) => l.x));
  const minY = Math.min(...selected.map((l) => l.y));
  const maxX = Math.max(...selected.map((l) => l.x + (l.width || 240)));
  const maxY = Math.max(...selected.map((l) => l.y + (l.height || 80)));
  const unionWidth = maxX - minX;
  const unionHeight = maxY - minY;

  // Handle Distribute Horizontally
  if (alignment === 'distribute-h') {
    const sorted = [...selected].sort((a, b) => a.x - b.x);
    const totalItemWidths = sorted.reduce((sum, l) => sum + (l.width || 240), 0);
    const freeSpace = unionWidth - totalItemWidths;
    const gap = sorted.length > 1 ? freeSpace / (sorted.length - 1) : 0;

    let currentX = minX;
    const xPositions = new Map<string, number>();

    sorted.forEach((layer) => {
      xPositions.set(layer.id, Math.round(currentX));
      currentX += (layer.width || 240) + gap;
    });

    return layers.map((layer) => {
      if (xPositions.has(layer.id) && !layer.isLocked) {
        return deepCloneLayer(layer, { x: xPositions.get(layer.id)! });
      }
      return layer;
    });
  }

  // Handle Distribute Vertically
  if (alignment === 'distribute-v') {
    const sorted = [...selected].sort((a, b) => a.y - b.y);
    const totalItemHeights = sorted.reduce((sum, l) => sum + (l.height || 80), 0);
    const freeSpace = unionHeight - totalItemHeights;
    const gap = sorted.length > 1 ? freeSpace / (sorted.length - 1) : 0;

    let currentY = minY;
    const yPositions = new Map<string, number>();

    sorted.forEach((layer) => {
      yPositions.set(layer.id, Math.round(currentY));
      currentY += (layer.height || 80) + gap;
    });

    return layers.map((layer) => {
      if (yPositions.has(layer.id) && !layer.isLocked) {
        return deepCloneLayer(layer, { y: yPositions.get(layer.id)! });
      }
      return layer;
    });
  }

  return layers.map((layer) => {
    if (!targetSet.has(layer.id) || layer.isLocked) return layer;

    const layerW = layer.width || 240;
    const layerH = layer.height || 80;

    let nextX = layer.x;
    let nextY = layer.y;

    switch (alignment) {
      case 'left':
        nextX = minX;
        break;
      case 'center':
        nextX = Math.round(minX + (unionWidth - layerW) / 2);
        break;
      case 'right':
        nextX = Math.round(maxX - layerW);
        break;
      case 'top':
        nextY = minY;
        break;
      case 'middle':
        nextY = Math.round(minY + (unionHeight - layerH) / 2);
        break;
      case 'bottom':
        nextY = Math.round(maxY - layerH);
        break;
    }

    return deepCloneLayer(layer, { x: nextX, y: nextY });
  });
}

/**
 * Deletes multiple selected layers, ensuring at least one layer exists if desired.
 */
export function deleteSelectedLayers(
  layers: TextLayer[],
  idsToDelete: string[]
): { updatedLayers: TextLayer[]; nextActiveId: string | null } {
  const targetSet = new Set(idsToDelete);
  const remaining = layers.filter((l) => !targetSet.has(l.id));

  if (remaining.length === 0) {
    const freshId = `layer-${Date.now()}`;
    const initialLayer: TextLayer = {
      id: freshId,
      name: 'متن ۱',
      type: 'text',
      text: '',
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
      style: layers[0]?.style || {
        fontFamily: 'Noto Nastaliq Urdu',
        fontSize: 32,
        bold: false,
        italic: false,
        underline: false,
        color: '#1c1917',
        align: 'right',
        lineHeight: 2.6,
        letterSpacing: 0,
        direction: 'rtl',
        opacity: 1,
      },
    };
    return { updatedLayers: [initialLayer], nextActiveId: freshId };
  }

  return { updatedLayers: remaining, nextActiveId: remaining[0].id };
}
