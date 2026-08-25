import React, { useRef, useState } from 'react';
import { TextLayer } from '../types';
import { RotateCw, Layers } from 'lucide-react';

interface CombinedCanvasSelectionBoxProps {
  selectedLayers: TextLayer[];
  onUpdateMultipleLayers: (updatedLayers: TextLayer[]) => void;
  canvasScale: number;
}

export const CombinedCanvasSelectionBox: React.FC<CombinedCanvasSelectionBoxProps> = ({
  selectedLayers,
  onUpdateMultipleLayers,
  canvasScale = 1,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(false);

  // Compute union bounding box
  const minX = Math.min(...selectedLayers.map((l) => l.x));
  const minY = Math.min(...selectedLayers.map((l) => l.y));
  const maxX = Math.max(...selectedLayers.map((l) => l.x + (l.width || 200)));
  const maxY = Math.max(...selectedLayers.map((l) => l.y + (l.height || 60)));

  const boxX = minX;
  const boxY = minY;
  const boxW = Math.max(30, maxX - minX);
  const boxH = Math.max(20, maxY - minY);
  const centerX = boxX + boxW / 2;
  const centerY = boxY + boxH / 2;

  // Refs for tracking interactive transformations
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    initialLayers: { id: string; x: number; y: number }[];
  }>({
    clientX: 0,
    clientY: 0,
    initialLayers: [],
  });

  const resizeStartRef = useRef<{
    clientX: number;
    clientY: number;
    corner: 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r';
    initialBoxX: number;
    initialBoxY: number;
    initialBoxW: number;
    initialBoxH: number;
    initialLayers: {
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fontSize: number;
    }[];
  }>({
    clientX: 0,
    clientY: 0,
    corner: 'br',
    initialBoxX: 0,
    initialBoxY: 0,
    initialBoxW: 0,
    initialBoxH: 0,
    initialLayers: [],
  });

  const rotateStartRef = useRef<{
    centerX: number;
    centerY: number;
    startAngle: number;
    initialLayers: {
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
    }[];
  }>({
    centerX: 0,
    centerY: 0,
    startAngle: 0,
    initialLayers: [],
  });

  // 1. Move Combined Selection
  const handleDragStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (selectedLayers.some((l) => l.isLocked)) return;

    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initialLayers: selectedLayers.map((l) => ({ id: l.id, x: l.x, y: l.y })),
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - dragStartRef.current.clientX) / canvasScale;
      const dy = (moveEvent.clientY - dragStartRef.current.clientY) / canvasScale;

      const initialMap = new Map<string, { id: string; x: number; y: number }>(
        dragStartRef.current.initialLayers.map((l) => [l.id, l])
      );

      const updated = selectedLayers.map((layer) => {
        const init = initialMap.get(layer.id);
        if (!init) return layer;
        return {
          ...layer,
          x: Math.round(init.x + dx),
          y: Math.round(init.y + dy),
        };
      });

      onUpdateMultipleLayers(updated);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // 2. Resize / Scale Combined Selection
  const handleResizeStart = (
    corner: 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r',
    e: React.PointerEvent
  ) => {
    e.stopPropagation();
    if (selectedLayers.some((l) => l.isLocked)) return;

    setIsResizing(true);
    resizeStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      corner,
      initialBoxX: boxX,
      initialBoxY: boxY,
      initialBoxW: boxW,
      initialBoxH: boxH,
      initialLayers: selectedLayers.map((l) => ({
        id: l.id,
        x: l.x,
        y: l.y,
        width: l.width || 200,
        height: l.height || 60,
        fontSize: l.style?.fontSize || 28,
      })),
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const {
        clientX,
        clientY,
        corner: c,
        initialBoxX,
        initialBoxY,
        initialBoxW,
        initialBoxH,
        initialLayers,
      } = resizeStartRef.current;

      const dx = (moveEvent.clientX - clientX) / canvasScale;
      const dy = (moveEvent.clientY - clientY) / canvasScale;

      let newBoxX = initialBoxX;
      let newBoxY = initialBoxY;
      let newBoxW = initialBoxW;
      let newBoxH = initialBoxH;

      if (c === 'br') {
        newBoxW = Math.max(40, initialBoxW + dx);
        newBoxH = Math.max(30, initialBoxH + dy);
      } else if (c === 'bl') {
        const potentialW = initialBoxW - dx;
        if (potentialW >= 40) {
          newBoxX = initialBoxX + dx;
          newBoxW = potentialW;
        }
        newBoxH = Math.max(30, initialBoxH + dy);
      } else if (c === 'tr') {
        newBoxW = Math.max(40, initialBoxW + dx);
        const potentialH = initialBoxH - dy;
        if (potentialH >= 30) {
          newBoxY = initialBoxY + dy;
          newBoxH = potentialH;
        }
      } else if (c === 'tl') {
        const potentialW = initialBoxW - dx;
        if (potentialW >= 40) {
          newBoxX = initialBoxX + dx;
          newBoxW = potentialW;
        }
        const potentialH = initialBoxH - dy;
        if (potentialH >= 30) {
          newBoxY = initialBoxY + dy;
          newBoxH = potentialH;
        }
      } else if (c === 'r') {
        newBoxW = Math.max(40, initialBoxW + dx);
      } else if (c === 'l') {
        const potentialW = initialBoxW - dx;
        if (potentialW >= 40) {
          newBoxX = initialBoxX + dx;
          newBoxW = potentialW;
        }
      } else if (c === 'b') {
        newBoxH = Math.max(30, initialBoxH + dy);
      } else if (c === 't') {
        const potentialH = initialBoxH - dy;
        if (potentialH >= 30) {
          newBoxY = initialBoxY + dy;
          newBoxH = potentialH;
        }
      }

      const scaleX = newBoxW / initialBoxW;
      const scaleY = newBoxH / initialBoxH;
      const minScale = Math.min(scaleX, scaleY);

      const initMap = new Map<
        string,
        {
          id: string;
          x: number;
          y: number;
          width: number;
          height: number;
          fontSize: number;
        }
      >(initialLayers.map((l) => [l.id, l]));

      const updated = selectedLayers.map((layer) => {
        const init = initMap.get(layer.id);
        if (!init) return layer;

        const relX = init.x - initialBoxX;
        const relY = init.y - initialBoxY;

        const nextX = Math.round(newBoxX + relX * scaleX);
        const nextY = Math.round(newBoxY + relY * scaleY);
        const nextW = Math.max(30, Math.round(init.width * scaleX));
        const nextH = Math.max(20, Math.round(init.height * scaleY));
        const nextFontSize = Math.max(10, Math.round(init.fontSize * minScale));

        return {
          ...layer,
          x: nextX,
          y: nextY,
          width: nextW,
          height: nextH,
          style: {
            ...layer.style,
            fontSize: nextFontSize,
          },
        };
      });

      onUpdateMultipleLayers(updated);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // 3. Rotate Combined Selection
  const handleRotateStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (selectedLayers.some((l) => l.isLocked)) return;

    // Convert center to viewport client coordinates
    const el = e.currentTarget.parentElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const clientCenterX = rect.left + rect.width / 2;
    const clientCenterY = rect.top + rect.height / 2;

    const startRad = Math.atan2(e.clientY - clientCenterY, e.clientX - clientCenterX);
    const startAngle = (startRad * 180) / Math.PI;

    setIsRotating(true);
    rotateStartRef.current = {
      centerX,
      centerY,
      startAngle,
      initialLayers: selectedLayers.map((l) => ({
        id: l.id,
        x: l.x,
        y: l.y,
        width: l.width || 200,
        height: l.height || 60,
        rotation: l.rotation || 0,
      })),
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const {
        centerX: cX,
        centerY: cY,
        startAngle: sAngle,
        initialLayers,
      } = rotateStartRef.current;

      const currentRad = Math.atan2(moveEvent.clientY - clientCenterY, moveEvent.clientX - clientCenterX);
      const currentAngle = (currentRad * 180) / Math.PI;
      const deltaAngle = currentAngle - sAngle;
      const deltaRad = (deltaAngle * Math.PI) / 180;

      const initMap = new Map<
        string,
        {
          id: string;
          x: number;
          y: number;
          width: number;
          height: number;
          rotation: number;
        }
      >(initialLayers.map((l) => [l.id, l]));

      const updated = selectedLayers.map((layer) => {
        const init = initMap.get(layer.id);
        if (!init) return layer;

        const layerCenterX = init.x + init.width / 2;
        const layerCenterY = init.y + init.height / 2;

        const relX = layerCenterX - cX;
        const relY = layerCenterY - cY;

        const rotatedRelX = relX * Math.cos(deltaRad) - relY * Math.sin(deltaRad);
        const rotatedRelY = relX * Math.sin(deltaRad) + relY * Math.cos(deltaRad);

        const newCenterX = cX + rotatedRelX;
        const newCenterY = cY + rotatedRelY;

        const nextX = Math.round(newCenterX - init.width / 2);
        const nextY = Math.round(newCenterY - init.height / 2);
        const nextRot = Math.round(((init.rotation + deltaAngle) % 360 + 360) % 360);

        return {
          ...layer,
          x: nextX,
          y: nextY,
          rotation: nextRot,
        };
      });

      onUpdateMultipleLayers(updated);
    };

    const handlePointerUp = () => {
      setIsRotating(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      data-export-exclude="true"
      className="absolute pointer-events-auto z-30 export-exclude"
      style={{
        left: `${boxX}px`,
        top: `${boxY}px`,
        width: `${boxW}px`,
        height: `${boxH}px`,
        touchAction: 'none',
      }}
      onPointerDown={handleDragStart}
    >
      {/* Combined Selection Bounding Box Outline */}
      <div
        className={`w-full h-full border-2 rounded-md transition-colors ${
          isDragging || isResizing || isRotating
            ? 'border-emerald-600 bg-emerald-500/10'
            : 'border-emerald-600/90 border-dashed bg-emerald-500/5 hover:border-emerald-700'
        } cursor-move shadow-sm`}
      />

      {/* Top Header Badge showing multi-selection count */}
      <div
        className="absolute -top-7 left-0 bg-emerald-800 text-white rounded-md px-2 py-0.5 text-[10px] font-sans font-bold flex items-center gap-1 shadow-md border border-emerald-700 pointer-events-none select-none"
        dir="rtl"
      >
        <Layers size={12} className="text-emerald-200" />
        <span>{selectedLayers.length} لئیر منتخب سُدہ</span>
      </div>

      {/* Rotation Handle (Top Center) */}
      <div
        className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-grab active:cursor-grabbing group z-40"
        onPointerDown={handleRotateStart}
        title="Rotate Selection (گھمائیں)"
        aria-label="Rotate Selection"
      >
        <div className="w-5 h-5 rounded-full bg-white border-2 border-emerald-700 shadow-md flex items-center justify-center text-emerald-800 group-hover:scale-110 group-hover:bg-emerald-50 transition-all">
          <RotateCw size={11} />
        </div>
        <div className="w-0.5 h-2 bg-emerald-700" />
      </div>

      {/* 4 Corner Resize Handles */}
      <div
        onPointerDown={(e) => handleResizeStart('tl', e)}
        className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-emerald-700 rounded-sm shadow-md cursor-nwse-resize hover:scale-125 transition-transform z-40"
        title="Resize Top-Left"
        aria-label="Resize Top-Left"
      />
      <div
        onPointerDown={(e) => handleResizeStart('tr', e)}
        className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-emerald-700 rounded-sm shadow-md cursor-nesw-resize hover:scale-125 transition-transform z-40"
        title="Resize Top-Right"
        aria-label="Resize Top-Right"
      />
      <div
        onPointerDown={(e) => handleResizeStart('bl', e)}
        className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-emerald-700 rounded-sm shadow-md cursor-nesw-resize hover:scale-125 transition-transform z-40"
        title="Resize Bottom-Left"
        aria-label="Resize Bottom-Left"
      />
      <div
        onPointerDown={(e) => handleResizeStart('br', e)}
        className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-emerald-700 rounded-sm shadow-md cursor-nwse-resize hover:scale-125 transition-transform z-40"
        title="Resize Bottom-Right"
        aria-label="Resize Bottom-Right"
      />

      {/* 4 Edge Resize Handles */}
      <div
        onPointerDown={(e) => handleResizeStart('t', e)}
        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-2 bg-white border-2 border-emerald-700 rounded-sm cursor-ns-resize hover:scale-110 z-40"
        title="Resize Top"
        aria-label="Resize Top"
      />
      <div
        onPointerDown={(e) => handleResizeStart('b', e)}
        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-2 bg-white border-2 border-emerald-700 rounded-sm cursor-ns-resize hover:scale-110 z-40"
        title="Resize Bottom"
        aria-label="Resize Bottom"
      />
      <div
        onPointerDown={(e) => handleResizeStart('l', e)}
        className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-5 bg-white border-2 border-emerald-700 rounded-sm cursor-ew-resize hover:scale-110 z-40"
        title="Resize Left"
        aria-label="Resize Left"
      />
      <div
        onPointerDown={(e) => handleResizeStart('r', e)}
        className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-5 bg-white border-2 border-emerald-700 rounded-sm cursor-ew-resize hover:scale-110 z-40"
        title="Resize Right"
        aria-label="Resize Right"
      />
    </div>
  );
};
