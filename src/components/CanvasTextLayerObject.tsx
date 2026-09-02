import React, { useRef, useState, useEffect } from 'react';
import { TextLayer } from '../types';
import { getFontFamilyCSS } from '../lib/fontUtils';
import {
  Lock,
  Unlock,
  RotateCw,
  Image as ImageIcon,
} from 'lucide-react';

interface CanvasTextLayerObjectProps {
  layer: TextLayer;
  isSelected: boolean;
  isPrimaryActive?: boolean;
  isMultiSelecting?: boolean;
  onSelect: (layerId: string, isMultiSelect?: boolean) => void;
  onUpdateLayer: (layerId: string, updates: Partial<TextLayer>) => void;
  onEditInNativeInput: (layer: TextLayer) => void;
  onDuplicateLayer?: (layerId: string) => void;
  onDeleteLayer?: (layerId: string) => void;
  onBringToFront?: (layerId: string) => void;
  onSendToBack?: (layerId: string) => void;
  onMoveUp?: (layerId: string) => void;
  onMoveDown?: (layerId: string) => void;
  canvasScale?: number;
  canGroup?: boolean;
  onGroupSelected?: () => void;
  onUngroupSelected?: () => void;
  onDragStateChange?: (isDragging: boolean, layerX: number, layerY: number, layerWidth: number, layerHeight: number) => void;
  onTransformEnd?: (layerId: string, actionType: 'move' | 'rotate' | 'resize') => void;
  onSnapPosition?: (
    layerId: string,
    rawX: number,
    rawY: number,
    width: number,
    height: number
  ) => { snappedX: number; snappedY: number; isSnappedX: boolean; isSnappedY: boolean };
}

export const CanvasTextLayerObject: React.FC<CanvasTextLayerObjectProps> = ({
  layer,
  isSelected,
  isPrimaryActive = true,
  isMultiSelecting = false,
  onSelect,
  onUpdateLayer,
  onEditInNativeInput,
  onDuplicateLayer,
  onDeleteLayer,
  onBringToFront,
  onSendToBack,
  canvasScale = 1,
  canGroup,
  onGroupSelected,
  onUngroupSelected,
  onDragStateChange,
  onTransformEnd,
  onSnapPosition,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [resizeCorner, setResizeCorner] = useState<'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | null>(null);

  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number }>({
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
  });

  const rotateStartRef = useRef<{ centerX: number; centerY: number; startAngle: number; initialRotation: number }>({
    centerX: 0,
    centerY: 0,
    startAngle: 0,
    initialRotation: 0,
  });

  const resizeStartRef = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startFontSize: number;
  }>({
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startFontSize: 24,
  });

  const lastTapRef = useRef<number>(0);

  // Handle Drag Move (Position x, y)
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
    onSelect(layer.id, isMultiSelect);

    // Double tap / click detection to edit in native input or replace image
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      lastTapRef.current = 0;
      onEditInNativeInput(layer);
      return;
    }
    lastTapRef.current = now;

    if (layer.isLocked) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: layer.x,
      startY: layer.y,
    };
    if (onDragStateChange) {
      const el = containerRef.current;
      const layerW = el ? el.offsetWidth : (layer.width || 200);
      const layerH = el ? el.offsetHeight : (layer.height || 60);
      onDragStateChange(true, layer.x, layer.y, layerW, layerH);
    }
  };

  // Handle Rotation Start
  const handleRotatePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (layer.isLocked) return;

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const startAngle = (rad * 180) / Math.PI;

    setIsRotating(true);
    rotateStartRef.current = {
      centerX,
      centerY,
      startAngle,
      initialRotation: layer.rotation || 0,
    };
  };

  // Handle Resize / Scale Start
  const handleResizePointerDown = (corner: 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r', e: React.PointerEvent) => {
    e.stopPropagation();
    if (layer.isLocked) return;

    setIsResizing(true);
    setResizeCorner(corner);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: layer.x,
      startY: layer.y,
      startWidth: layer.width || (layer.type === 'image' ? 240 : 300),
      startHeight: layer.height || (layer.type === 'image' ? 180 : 100),
      startFontSize: layer.style?.fontSize || 24,
    };
  };

  // Global Pointer Move & Up Event Handlers for Drag, Rotate, Resize
  useEffect(() => {
    if (!isDragging && !isRotating && !isResizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const dx = (e.clientX - dragStartRef.current.x) / canvasScale;
        const dy = (e.clientY - dragStartRef.current.y) / canvasScale;
        const rawX = Math.round(dragStartRef.current.startX + dx);
        const rawY = Math.round(dragStartRef.current.startY + dy);

        const el = containerRef.current;
        const layerW = el ? el.offsetWidth : (layer.width || 200);
        const layerH = el ? el.offsetHeight : (layer.height || 60);

        let finalX = rawX;
        let finalY = rawY;

        if (onSnapPosition) {
          const snap = onSnapPosition(layer.id, rawX, rawY, layerW, layerH);
          finalX = snap.snappedX;
          finalY = snap.snappedY;
        }

        onUpdateLayer(layer.id, {
          x: finalX,
          y: finalY,
        });

        if (onDragStateChange) {
          onDragStateChange(
            true,
            finalX,
            finalY,
            layerW,
            layerH
          );
        }
      } else if (isRotating) {
        const { centerX, centerY, startAngle, initialRotation } = rotateStartRef.current;
        const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        const currentAngle = (rad * 180) / Math.PI;
        let diff = currentAngle - startAngle;
        let newRot = Math.round(initialRotation + diff);
        // Normalize rotation between 0 and 360
        newRot = ((newRot % 360) + 360) % 360;
        // Snap to 0, 90, 180, 270 if close
        if (Math.abs(newRot - 0) < 3 || Math.abs(newRot - 360) < 3) newRot = 0;
        else if (Math.abs(newRot - 90) < 3) newRot = 90;
        else if (Math.abs(newRot - 180) < 3) newRot = 180;
        else if (Math.abs(newRot - 270) < 3) newRot = 270;

        onUpdateLayer(layer.id, {
          rotation: newRot,
          style: {
            ...layer.style,
            rotation: newRot,
          },
        });
      } else if (isResizing && resizeCorner) {
        const dx = (e.clientX - resizeStartRef.current.x) / canvasScale;
        const dy = (e.clientY - resizeStartRef.current.y) / canvasScale;
        const { startWidth, startHeight, startX, startY, startFontSize } = resizeStartRef.current;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startX;
        let newY = startY;
        let newFontSize = startFontSize;

        const isImage = layer.type === 'image';
        const lockAspect = isImage ? (layer.lockAspectRatio !== false) : false;
        const aspect = layer.aspectRatio || (startWidth / Math.max(1, startHeight));

        if (resizeCorner === 'br') {
          newWidth = Math.max(30, startWidth + dx);
          if (lockAspect) {
            newHeight = Math.max(30, Math.round(newWidth / aspect));
          } else {
            newHeight = Math.max(20, startHeight + dy);
          }
          const scaleRatio = newWidth / Math.max(1, startWidth);
          newFontSize = Math.max(8, Math.min(180, Math.round(startFontSize * scaleRatio)));
        } else if (resizeCorner === 'bl') {
          newWidth = Math.max(30, startWidth - dx);
          if (lockAspect) {
            newHeight = Math.max(30, Math.round(newWidth / aspect));
          } else {
            newHeight = Math.max(20, startHeight + dy);
          }
          newX = startX + (startWidth - newWidth);
          const scaleRatio = newWidth / Math.max(1, startWidth);
          newFontSize = Math.max(8, Math.min(180, Math.round(startFontSize * scaleRatio)));
        } else if (resizeCorner === 'tr') {
          newWidth = Math.max(30, startWidth + dx);
          if (lockAspect) {
            newHeight = Math.max(30, Math.round(newWidth / aspect));
          } else {
            newHeight = Math.max(20, startHeight - dy);
          }
          newY = startY + (startHeight - newHeight);
          const scaleRatio = newWidth / Math.max(1, startWidth);
          newFontSize = Math.max(8, Math.min(180, Math.round(startFontSize * scaleRatio)));
        } else if (resizeCorner === 'tl') {
          newWidth = Math.max(30, startWidth - dx);
          if (lockAspect) {
            newHeight = Math.max(30, Math.round(newWidth / aspect));
          } else {
            newHeight = Math.max(20, startHeight - dy);
          }
          newX = startX + (startWidth - newWidth);
          newY = startY + (startHeight - newHeight);
          const scaleRatio = newWidth / Math.max(1, startWidth);
          newFontSize = Math.max(8, Math.min(180, Math.round(startFontSize * scaleRatio)));
        } else if (resizeCorner === 'r') {
          newWidth = Math.max(30, startWidth + dx);
          if (lockAspect && isImage) {
            newHeight = Math.max(30, Math.round(newWidth / aspect));
          }
        } else if (resizeCorner === 'l') {
          newWidth = Math.max(30, startWidth - dx);
          newX = startX + (startWidth - newWidth);
          if (lockAspect && isImage) {
            newHeight = Math.max(30, Math.round(newWidth / aspect));
          }
        } else if (resizeCorner === 'b') {
          newHeight = Math.max(20, startHeight + dy);
          if (lockAspect && isImage) {
            newWidth = Math.max(30, Math.round(newHeight * aspect));
          }
        } else if (resizeCorner === 't') {
          newHeight = Math.max(20, startHeight - dy);
          newY = startY + (startHeight - newHeight);
          if (lockAspect && isImage) {
            newWidth = Math.max(30, Math.round(newHeight * aspect));
          }
        }

        const updates: Partial<TextLayer> = {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        };

        if (!isImage && layer.style) {
          updates.style = {
            ...layer.style,
            fontSize: newFontSize,
          };
        }

        onUpdateLayer(layer.id, updates);
      }
    };

    const handlePointerUp = () => {
      const wasDragging = isDragging;
      const wasRotating = isRotating;
      const wasResizing = isResizing;

      setIsDragging(false);
      setIsRotating(false);
      setIsResizing(false);
      setResizeCorner(null);

      if (onDragStateChange) {
        onDragStateChange(false, layer.x, layer.y, layer.width || 200, layer.height || 60);
      }

      if (onTransformEnd) {
        if (wasDragging) onTransformEnd(layer.id, 'move');
        else if (wasRotating) onTransformEnd(layer.id, 'rotate');
        else if (wasResizing) onTransformEnd(layer.id, 'resize');
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, isRotating, isResizing, resizeCorner, canvasScale, layer.id, onUpdateLayer, onDragStateChange, onSnapPosition, layer.x, layer.y, layer.width, layer.height, layer.type, layer.aspectRatio, layer.lockAspectRatio, layer.style]);

  if (layer.isHidden) return null;

  const isImageLayer = layer.type === 'image';
  const fontFamCSS = !isImageLayer && layer.style ? getFontFamilyCSS(layer.style.fontFamily || 'Noto Nastaliq Urdu') : undefined;
  const textShadowCSS = !isImageLayer && layer.style?.shadowColor
    ? `${layer.style.shadowOffsetX || 0}px ${layer.style.shadowOffsetY || 2}px ${layer.style.shadowBlur || 4}px ${layer.style.shadowColor}`
    : 'none';
  const strokeWidth = !isImageLayer ? (layer.style?.strokeWidth ?? 0) : 0;
  const strokeCSS = (!isImageLayer && layer.style?.strokeColor && strokeWidth > 0)
    ? `${strokeWidth}px ${layer.style.strokeColor}`
    : 'none';

  // Compute image filter string
  const filterParts: string[] = [];
  if (layer.brightness !== undefined && layer.brightness !== 1) filterParts.push(`brightness(${layer.brightness})`);
  if (layer.contrast !== undefined && layer.contrast !== 1) filterParts.push(`contrast(${layer.contrast})`);
  if (layer.grayscale && layer.grayscale > 0) filterParts.push(`grayscale(${layer.grayscale}%)`);
  if (layer.blur && layer.blur > 0) filterParts.push(`blur(${layer.blur}px)`);
  const imageFilterCSS = filterParts.join(' ') || undefined;

  // Compute image shadow CSS
  const imageShadowCSS = (layer.shadow || (layer.style && layer.style.shadowBlur))
    ? `${layer.shadowOffsetX ?? layer.style?.shadowOffsetX ?? 0}px ${layer.shadowOffsetY ?? layer.style?.shadowOffsetY ?? 4}px ${layer.shadowBlur ?? layer.style?.shadowBlur ?? 8}px ${layer.shadowColor ?? layer.style?.shadowColor ?? 'rgba(0,0,0,0.35)'}`
    : undefined;

  const effectiveFlipX = layer.flipX ?? layer.style?.flipX ?? false;
  const effectiveFlipY = layer.flipY ?? layer.style?.flipY ?? false;
  const effectiveRotation = layer.rotation ?? layer.style?.rotation ?? 0;
  const effectiveScale = layer.scale || 1;

  const effectiveRadius = layer.cropPreset === 'circle'
    ? '9999px'
    : `${layer.borderRadius ?? layer.style?.borderRadius ?? 0}px`;

  const effectiveBorderWidth = layer.borderWidth ?? layer.style?.borderWidth ?? 0;
  const effectiveBorderColor = layer.borderColor ?? layer.style?.borderColor ?? '#000000';

  return (
    <div
      ref={containerRef}
      id={`canvas-layer-${layer.id}`}
      data-layer-id={layer.id}
      onPointerDown={handlePointerDown}
      className={`absolute select-none cursor-pointer transition-shadow ${
        isSelected
          ? 'ring-2 ring-emerald-600 ring-offset-1 ring-offset-white'
          : 'hover:ring-1 hover:ring-emerald-400/60'
      }`}
      style={{
        left: `${layer.x}px`,
        top: `${layer.y}px`,
        width: layer.width ? `${layer.width}px` : (isImageLayer ? '200px' : 'auto'),
        height: layer.height ? `${layer.height}px` : 'auto',
        minWidth: '30px',
        minHeight: '30px',
        transform: `rotate(${effectiveRotation}deg) scale(${effectiveScale}) scaleX(${effectiveFlipX ? -1 : 1}) scaleY(${effectiveFlipY ? -1 : 1})`,
        transformOrigin: 'center center',
        zIndex: layer.zIndex ?? 10,
        opacity: layer.opacity ?? 1,
        touchAction: 'none',
        willChange: isDragging || isResizing || isRotating ? 'transform, left, top' : 'auto',
      }}
    >
      {/* 1. IMAGE LAYER RENDERING */}
      {isImageLayer ? (
        <div
          className="w-full h-full overflow-hidden transition-all flex items-center justify-center pointer-events-none select-none"
          style={{
            borderRadius: effectiveRadius,
            borderWidth: effectiveBorderWidth > 0 ? `${effectiveBorderWidth}px` : '0px',
            borderColor: effectiveBorderColor,
            borderStyle: effectiveBorderWidth > 0 ? 'solid' : 'none',
            boxShadow: imageShadowCSS,
          }}
        >
          {layer.src ? (
            <img
              src={layer.src}
              alt={layer.name || 'Canvas Image'}
              className="w-full h-full pointer-events-none select-none"
              referrerPolicy="no-referrer"
              style={{
                objectFit:
                  layer.cropPreset === '1:1' ||
                  layer.cropPreset === 'circle' ||
                  layer.cropPreset === '4:3' ||
                  layer.cropPreset === '16:9'
                    ? 'cover'
                    : layer.objectFit || 'contain',
                filter: imageFilterCSS,
              }}
            />
          ) : (
            <div className="w-full h-full bg-stone-100 border-2 border-dashed border-stone-300 flex flex-col items-center justify-center p-2 text-stone-400">
              <ImageIcon size={24} />
              <span className="text-[10px] font-sans mt-1">Image Object</span>
            </div>
          )}
        </div>
      ) : (
        /* 2. TEXT LAYER RENDERING WITH NOTO NASTALIQ URDU OPENTYPE SHAPING */
        <div
          className="w-full h-full whitespace-pre-wrap break-words font-nastaliq overflow-visible transition-all"
          dir={layer.style?.direction || 'rtl'}
          style={{
            fontFamily: fontFamCSS,
            fontSize: `${layer.style?.fontSize || 24}px`,
            fontWeight: layer.style?.bold ? 'bold' : 'normal',
            fontStyle: layer.style?.italic ? 'italic' : 'normal',
            textDecoration: layer.style?.underline ? 'underline' : 'none',
            backgroundColor: layer.style?.highlightGradient
              ? undefined
              : (layer.style?.highlightColor || 'transparent'),
            backgroundImage: layer.style?.highlightGradient || undefined,
            borderRadius: `${layer.style?.borderRadius || 0}px`,
            padding: `${layer.style?.padding !== undefined ? layer.style.padding : 6}px`,
            borderWidth: `${layer.style?.borderWidth || 0}px`,
            borderColor: layer.style?.borderColor || 'transparent',
            borderStyle: layer.style?.borderWidth ? 'solid' : 'none',
            textAlign: layer.style?.align || 'center',
            lineHeight: layer.style?.lineHeight || 2.2,
            letterSpacing: `${layer.style?.letterSpacing || 0}px`,
            textShadow: textShadowCSS,
            paintOrder: 'stroke fill',
            WebkitPaintOrder: 'stroke fill',
            WebkitTextStroke: strokeCSS,
            opacity: layer.style?.opacity ?? 1,
            fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1',
          }}
        >
          {layer.style?.gradient ? (
            <span
              key={`gradient-span-${layer.id}`}
              style={{
                backgroundColor: 'transparent',
                backgroundImage: layer.style.gradient,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                maxWidth: '100%',
              }}
            >
              {layer.text || <span className="text-stone-400 italic">Enter text...</span>}
            </span>
          ) : (
            <span
              key={`solid-span-${layer.id}`}
              style={{
                backgroundColor: 'transparent',
                color: layer.style?.color || '#1c1917',
                display: 'inline-block',
                maxWidth: '100%',
              }}
            >
              {layer.text || <span className="text-stone-400 italic">Enter text...</span>}
            </span>
          )}
        </div>
      )}

      {/* Interactive Selection Bounding Box & Transformation Handles */}
      {isSelected && !layer.isLocked && !isMultiSelecting && (
        <div className="export-exclude pointer-events-auto" data-export-exclude="true">
          {/* Top Rotation Handle & Stem */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto export-exclude" data-export-exclude="true">
            <button
              type="button"
              onPointerDown={handleRotatePointerDown}
              className="w-6 h-6 rounded-full bg-white border-2 border-emerald-700 shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform export-exclude"
              title="Drag to Rotate"
              aria-label="Rotate"
              data-export-exclude="true"
            >
              <RotateCw size={12} className="text-emerald-800" />
            </button>
            <div className="w-0.5 h-2 bg-emerald-600 export-exclude" data-export-exclude="true" />
          </div>

          {/* 4 Corner Resize Handles */}
          <div
            onPointerDown={(e) => handleResizePointerDown('tl', e)}
            className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-emerald-700 rounded-sm shadow-md cursor-nwse-resize hover:scale-125 transition-transform export-exclude"
            title="Resize Top-Left"
            aria-label="Resize Top-Left"
            data-export-exclude="true"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown('tr', e)}
            className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-emerald-700 rounded-sm shadow-md cursor-nesw-resize hover:scale-125 transition-transform export-exclude"
            title="Resize Top-Right"
            aria-label="Resize Top-Right"
            data-export-exclude="true"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown('bl', e)}
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-emerald-700 rounded-sm shadow-md cursor-nesw-resize hover:scale-125 transition-transform export-exclude"
            title="Resize Bottom-Left"
            aria-label="Resize Bottom-Left"
            data-export-exclude="true"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown('br', e)}
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-emerald-700 rounded-sm shadow-md cursor-nwse-resize hover:scale-125 transition-transform export-exclude"
            title="Resize Bottom-Right"
            aria-label="Resize Bottom-Right"
            data-export-exclude="true"
          />

          {/* Edge Midpoint Resize Handles (Horizontal / Vertical) */}
          <div
            onPointerDown={(e) => handleResizePointerDown('t', e)}
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-2 bg-white border-2 border-emerald-700 rounded-sm cursor-ns-resize hover:scale-110 export-exclude"
            title="Resize Height Top"
            aria-label="Resize Top"
            data-export-exclude="true"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown('b', e)}
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-2 bg-white border-2 border-emerald-700 rounded-sm cursor-ns-resize hover:scale-110 export-exclude"
            title="Resize Height Bottom"
            aria-label="Resize Bottom"
            data-export-exclude="true"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown('l', e)}
            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-5 bg-white border-2 border-emerald-700 rounded-sm cursor-ew-resize hover:scale-110 export-exclude"
            title="Resize Width Left"
            aria-label="Resize Left"
            data-export-exclude="true"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown('r', e)}
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-5 bg-white border-2 border-emerald-700 rounded-sm cursor-ew-resize hover:scale-110 export-exclude"
            title="Resize Width Right"
            aria-label="Resize Right"
            data-export-exclude="true"
          />
        </div>
      )}

      {/* Locked Layer Badge */}
      {isSelected && layer.isLocked && (
        <div
          className="absolute -top-8 right-0 bg-stone-950 text-white rounded-lg px-2 py-1 text-xs flex items-center gap-1.5 shadow-xl border border-stone-700 pointer-events-auto export-exclude"
          data-export-exclude="true"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Lock size={13} className="text-amber-400" />
          <button
            type="button"
            onClick={() => onUpdateLayer(layer.id, { isLocked: false })}
            className="text-emerald-400 hover:text-emerald-300 font-sans font-bold text-xs cursor-pointer p-0.5"
            title="Unlock Layer"
            aria-label="Unlock Layer"
          >
            <Unlock size={13} />
          </button>
        </div>
      )}
    </div>
  );
};
