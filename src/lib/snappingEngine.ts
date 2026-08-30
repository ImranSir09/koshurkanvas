import { TextLayer } from '../types';
import { getLayerVisualBounds } from './layerUtils';

export interface SnapGuide {
  id: string;
  type: 'vertical' | 'horizontal';
  position: number; // Canvas pixel position (X for vertical, Y for horizontal)
  start?: number;   // Line start coordinate
  end?: number;     // Line end coordinate
  label: string;    // Human readable alignment description
  source: 'canvas' | 'layer' | 'margin';
}

export interface SnapResult {
  snappedX: number;
  snappedY: number;
  isSnappedX: boolean;
  isSnappedY: boolean;
  activeGuides: SnapGuide[];
}

/**
 * Calculates magnet snapping coordinates and alignment guidelines
 * when moving or resizing layers on the canvas stage.
 */
export function calculateSnapping(
  currentLayerId: string | string[],
  rawX: number,
  rawY: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number,
  allLayers: TextLayer[],
  snapEnabled = true,
  threshold = 8
): SnapResult {
  if (!snapEnabled) {
    return {
      snappedX: Math.round(rawX),
      snappedY: Math.round(rawY),
      isSnappedX: false,
      isSnappedY: false,
      activeGuides: [],
    };
  }

  const excludedIds = new Set(
    Array.isArray(currentLayerId) ? currentLayerId : [currentLayerId]
  );

  let bestX = rawX;
  let bestXDistance = threshold + 1;
  let bestXGuide: SnapGuide | null = null;

  let bestY = rawY;
  let bestYDistance = threshold + 1;
  let bestYGuide: SnapGuide | null = null;

  const currentRightX = rawX + width;
  const currentCenterX = rawX + width / 2;

  const currentBottomY = rawY + height;
  const currentCenterY = rawY + height / 2;

  // 1. CANVAS BOUNDARY & CENTER TARGETS - VERTICAL (X)
  const canvasTargetsX = [
    { targetX: canvasWidth / 2 - width / 2, guidePos: canvasWidth / 2, label: 'Center X', source: 'canvas' as const },
    { targetX: 0, guidePos: 0, label: 'Left Edge', source: 'canvas' as const },
    { targetX: 24, guidePos: 24, label: 'Margin Left', source: 'margin' as const },
    { targetX: canvasWidth - width, guidePos: canvasWidth, label: 'Right Edge', source: 'canvas' as const },
    { targetX: canvasWidth - width - 24, guidePos: canvasWidth - 24, label: 'Margin Right', source: 'margin' as const },
  ];

  for (const t of canvasTargetsX) {
    const dist = Math.abs(rawX - t.targetX);
    if (dist <= threshold && dist < bestXDistance) {
      bestXDistance = dist;
      bestX = t.targetX;
      bestXGuide = {
        id: `v-${t.guidePos}-${t.label}`,
        type: 'vertical',
        position: t.guidePos,
        start: 0,
        end: canvasHeight,
        label: t.label,
        source: t.source,
      };
    }
  }

  // 2. CANVAS BOUNDARY & CENTER TARGETS - HORIZONTAL (Y)
  const canvasTargetsY = [
    { targetY: canvasHeight / 2 - height / 2, guidePos: canvasHeight / 2, label: 'Center Y', source: 'canvas' as const },
    { targetY: 0, guidePos: 0, label: 'Top Edge', source: 'canvas' as const },
    { targetY: 24, guidePos: 24, label: 'Margin Top', source: 'margin' as const },
    { targetY: canvasHeight - height, guidePos: canvasHeight, label: 'Bottom Edge', source: 'canvas' as const },
    { targetY: canvasHeight - height - 24, guidePos: canvasHeight - 24, label: 'Margin Bottom', source: 'margin' as const },
  ];

  for (const t of canvasTargetsY) {
    const dist = Math.abs(rawY - t.targetY);
    if (dist <= threshold && dist < bestYDistance) {
      bestYDistance = dist;
      bestY = t.targetY;
      bestYGuide = {
        id: `h-${t.guidePos}-${t.label}`,
        type: 'horizontal',
        position: t.guidePos,
        start: 0,
        end: canvasWidth,
        label: t.label,
        source: t.source,
      };
    }
  }

  // 3. INTER-LAYER TARGETS (Aligning against other visible layers)
  for (const layer of allLayers) {
    if (excludedIds.has(layer.id) || layer.isHidden) continue;

    const bounds = getLayerVisualBounds(layer);
    const otherX = bounds.minX;
    const otherWidth = bounds.visualWidth;
    const otherCenterX = bounds.centerX;
    const otherRightX = bounds.maxX;

    const otherY = bounds.minY;
    const otherHeight = bounds.visualHeight;
    const otherCenterY = bounds.centerY;
    const otherBottomY = bounds.maxY;

    const startY = Math.min(rawY, otherY) - 15;
    const endY = Math.max(rawY + height, otherY + otherHeight) + 15;

    const startX = Math.min(rawX, otherX) - 15;
    const endX = Math.max(rawX + width, otherX + otherWidth) + 15;

    // X Alignment checks:
    // a. Left-to-Left
    const d1 = Math.abs(rawX - otherX);
    if (d1 <= threshold && d1 < bestXDistance) {
      bestXDistance = d1;
      bestX = otherX;
      bestXGuide = {
        id: `v-l2l-${otherX}`,
        type: 'vertical',
        position: otherX,
        start: startY,
        end: endY,
        label: `Align Left (${layer.name})`,
        source: 'layer',
      };
    }

    // b. Right-to-Right
    const d2 = Math.abs(currentRightX - otherRightX);
    if (d2 <= threshold && d2 < bestXDistance) {
      bestXDistance = d2;
      bestX = otherRightX - width;
      bestXGuide = {
        id: `v-r2r-${otherRightX}`,
        type: 'vertical',
        position: otherRightX,
        start: startY,
        end: endY,
        label: `Align Right (${layer.name})`,
        source: 'layer',
      };
    }

    // c. Center-to-Center X
    const d3 = Math.abs(currentCenterX - otherCenterX);
    if (d3 <= threshold && d3 < bestXDistance) {
      bestXDistance = d3;
      bestX = otherCenterX - width / 2;
      bestXGuide = {
        id: `v-c2c-${otherCenterX}`,
        type: 'vertical',
        position: otherCenterX,
        start: startY,
        end: endY,
        label: `Center X (${layer.name})`,
        source: 'layer',
      };
    }

    // d. Left-to-Right
    const d4 = Math.abs(rawX - otherRightX);
    if (d4 <= threshold && d4 < bestXDistance) {
      bestXDistance = d4;
      bestX = otherRightX;
      bestXGuide = {
        id: `v-l2r-${otherRightX}`,
        type: 'vertical',
        position: otherRightX,
        start: startY,
        end: endY,
        label: `Edge Align (${layer.name})`,
        source: 'layer',
      };
    }

    // e. Right-to-Left
    const d5 = Math.abs(currentRightX - otherX);
    if (d5 <= threshold && d5 < bestXDistance) {
      bestXDistance = d5;
      bestX = otherX - width;
      bestXGuide = {
        id: `v-r2l-${otherX}`,
        type: 'vertical',
        position: otherX,
        start: startY,
        end: endY,
        label: `Edge Align (${layer.name})`,
        source: 'layer',
      };
    }

    // Y Alignment checks:
    // a. Top-to-Top
    const dy1 = Math.abs(rawY - otherY);
    if (dy1 <= threshold && dy1 < bestYDistance) {
      bestYDistance = dy1;
      bestY = otherY;
      bestYGuide = {
        id: `h-t2t-${otherY}`,
        type: 'horizontal',
        position: otherY,
        start: startX,
        end: endX,
        label: `Align Top (${layer.name})`,
        source: 'layer',
      };
    }

    // b. Bottom-to-Bottom
    const dy2 = Math.abs(currentBottomY - otherBottomY);
    if (dy2 <= threshold && dy2 < bestYDistance) {
      bestYDistance = dy2;
      bestY = otherBottomY - height;
      bestYGuide = {
        id: `h-b2b-${otherBottomY}`,
        type: 'horizontal',
        position: otherBottomY,
        start: startX,
        end: endX,
        label: `Align Bottom (${layer.name})`,
        source: 'layer',
      };
    }

    // c. Center-to-Center Y
    const dy3 = Math.abs(currentCenterY - otherCenterY);
    if (dy3 <= threshold && dy3 < bestYDistance) {
      bestYDistance = dy3;
      bestY = otherCenterY - height / 2;
      bestYGuide = {
        id: `h-c2c-${otherCenterY}`,
        type: 'horizontal',
        position: otherCenterY,
        start: startX,
        end: endX,
        label: `Center Y (${layer.name})`,
        source: 'layer',
      };
    }

    // d. Top-to-Bottom
    const dy4 = Math.abs(rawY - otherBottomY);
    if (dy4 <= threshold && dy4 < bestYDistance) {
      bestYDistance = dy4;
      bestY = otherBottomY;
      bestYGuide = {
        id: `h-t2b-${otherBottomY}`,
        type: 'horizontal',
        position: otherBottomY,
        start: startX,
        end: endX,
        label: `Edge Align (${layer.name})`,
        source: 'layer',
      };
    }

    // e. Bottom-to-Top
    const dy5 = Math.abs(currentBottomY - otherY);
    if (dy5 <= threshold && dy5 < bestYDistance) {
      bestYDistance = dy5;
      bestY = otherY - height;
      bestYGuide = {
        id: `h-b2t-${otherY}`,
        type: 'horizontal',
        position: otherY,
        start: startX,
        end: endX,
        label: `Edge Align (${layer.name})`,
        source: 'layer',
      };
    }
  }

  const activeGuides: SnapGuide[] = [];
  if (bestXGuide) activeGuides.push(bestXGuide);
  if (bestYGuide) activeGuides.push(bestYGuide);

  return {
    snappedX: Math.round(bestX),
    snappedY: Math.round(bestY),
    isSnappedX: bestXGuide !== null,
    isSnappedY: bestYGuide !== null,
    activeGuides,
  };
}
