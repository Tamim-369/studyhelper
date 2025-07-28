'use client';

import { useState, useRef, useCallback } from 'react';

interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SelectionOverlayProps {
  onSelectionComplete: (selection: SelectionArea) => void;
  isSelecting: boolean;
  onSelectionStart: () => void;
  onSelectionEnd: () => void;
}

export default function SelectionOverlay({
  onSelectionComplete,
  isSelecting,
  onSelectionStart,
  onSelectionEnd,
}: SelectionOverlayProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentSelection, setCurrentSelection] = useState<SelectionArea | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const getRelativePosition = useCallback((e: React.MouseEvent) => {
    if (!overlayRef.current) return { x: 0, y: 0 };

    const rect = overlayRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isSelecting) return;

    e.preventDefault();
    const point = getRelativePosition(e);
    setStartPoint(point);
    setIsDrawing(true);
    setCurrentSelection(null);
    onSelectionStart();
  }, [isSelecting, getRelativePosition, onSelectionStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !isSelecting) return;

    e.preventDefault();
    const currentPoint = getRelativePosition(e);

    const selection: SelectionArea = {
      x: Math.min(startPoint.x, currentPoint.x),
      y: Math.min(startPoint.y, currentPoint.y),
      width: Math.abs(currentPoint.x - startPoint.x),
      height: Math.abs(currentPoint.y - startPoint.y),
    };

    setCurrentSelection(selection);
  }, [isDrawing, isSelecting, startPoint, getRelativePosition]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !isSelecting) return;

    e.preventDefault();
    setIsDrawing(false);

    if (currentSelection && currentSelection.width > 10 && currentSelection.height > 10) {
      onSelectionComplete(currentSelection);
    }

    setCurrentSelection(null);
    onSelectionEnd();
  }, [isDrawing, isSelecting, currentSelection, onSelectionComplete, onSelectionEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      setCurrentSelection(null);
      onSelectionEnd();
    }
  }, [isDrawing, onSelectionEnd]);

  if (!isSelecting) return null;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-10"
      style={{ cursor: isSelecting ? 'crosshair' : 'default' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Selection rectangle */}
      {currentSelection && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
          style={{
            left: currentSelection.x,
            top: currentSelection.y,
            width: currentSelection.width,
            height: currentSelection.height,
          }}
        >
          {/* Corner indicators */}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />

          {/* Selection info */}
          <div className="absolute -top-8 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {Math.round(currentSelection.width)} × {Math.round(currentSelection.height)}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute top-4 left-4 bg-black/80 text-white text-sm px-4 py-3 rounded-lg pointer-events-none backdrop-blur-sm shadow-lg border border-white/20">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span className="font-medium">AI Screenshot Mode Active</span>
        </div>
        <div className="text-xs text-gray-200 space-y-1">
          <div>• Drag to select any area of the PDF</div>
          <div>• AI will extract text and explain it</div>
          <div>• Press <kbd className="bg-white/20 px-1 rounded text-white">Esc</kbd> to cancel</div>
        </div>
      </div>

      {/* Selection hint when drawing */}
      {currentSelection && (
        <div className="absolute top-4 right-4 bg-blue-600/90 text-white text-xs px-3 py-2 rounded-lg pointer-events-none backdrop-blur-sm shadow-lg">
          <div className="font-medium">Selection: {Math.round(currentSelection.width)} × {Math.round(currentSelection.height)}px</div>
          <div className="text-blue-200 mt-1">Release to capture & analyze</div>
        </div>
      )}
    </div>
  );
}
