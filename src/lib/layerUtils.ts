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
