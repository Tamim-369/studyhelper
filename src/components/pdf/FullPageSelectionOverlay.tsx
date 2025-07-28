'use client';

import { useState, useCallback, useEffect } from 'react';

interface SelectionArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface FullPageSelectionOverlayProps {
    onSelectionComplete: (selection: SelectionArea) => void;
    isSelecting: boolean;
    onSelectionStart: () => void;
    onSelectionEnd: () => void;
}

export default function FullPageSelectionOverlay({
    onSelectionComplete,
    isSelecting,
    onSelectionStart,
    onSelectionEnd,
}: FullPageSelectionOverlayProps) {
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
    const [currentSelection, setCurrentSelection] = useState<SelectionArea | null>(null);
    const [mounted, setMounted] = useState(false);

    // Mount the component after hydration to avoid SSR issues
    useEffect(() => {
        setMounted(true);
    }, []);

    const getAbsolutePosition = useCallback((e: MouseEvent) => {
        return {
            x: e.clientX + window.scrollX,
            y: e.clientY + window.scrollY,
        };
    }, []);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        console.log('🖱️ Mouse down detected, isSelecting:', isSelecting);
        if (!isSelecting) return;

        e.preventDefault();
        e.stopPropagation();

        const point = getAbsolutePosition(e);
        console.log('📍 Start point:', point);
        setStartPoint(point);
        setIsDrawing(true);
        setCurrentSelection(null);
        onSelectionStart();
    }, [isSelecting, getAbsolutePosition, onSelectionStart]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDrawing || !isSelecting) return;

        e.preventDefault();
        e.stopPropagation();

        const currentPoint = getAbsolutePosition(e);

        const selection: SelectionArea = {
            x: Math.min(startPoint.x, currentPoint.x),
            y: Math.min(startPoint.y, currentPoint.y),
            width: Math.abs(currentPoint.x - startPoint.x),
            height: Math.abs(currentPoint.y - startPoint.y),
        };

        setCurrentSelection(selection);
    }, [isDrawing, isSelecting, startPoint, getAbsolutePosition]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        console.log('🖱️ Mouse up detected, isDrawing:', isDrawing, 'isSelecting:', isSelecting);
        if (!isDrawing || !isSelecting) return;

        e.preventDefault();
        e.stopPropagation();

        setIsDrawing(false);

        console.log('📏 Current selection:', currentSelection);
        if (currentSelection && currentSelection.width > 10 && currentSelection.height > 10) {
            // Convert absolute coordinates to viewport coordinates for html2canvas
            const viewportSelection = {
                x: currentSelection.x - window.scrollX,
                y: currentSelection.y - window.scrollY,
                width: currentSelection.width,
                height: currentSelection.height,
            };
            console.log('✅ Selection valid, calling onSelectionComplete with:', viewportSelection);
            onSelectionComplete(viewportSelection);
        } else {
            console.log('❌ Selection too small or invalid:', currentSelection);
        }

        setCurrentSelection(null);
        onSelectionEnd();
    }, [isDrawing, isSelecting, currentSelection, onSelectionComplete, onSelectionEnd]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && isSelecting) {
            setIsDrawing(false);
            setCurrentSelection(null);
            onSelectionEnd();
        }
    }, [isSelecting, onSelectionEnd]);

    useEffect(() => {
        if (!isSelecting) return;

        console.log('🔧 FullPageSelectionOverlay useEffect triggered');
        console.log('📍 Overlay - Current scroll position:', window.scrollX, window.scrollY);

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('keydown', handleKeyDown);

        // Prevent text selection and context menu during selection
        // Also prevent any scroll behavior
        const originalScrollX = window.scrollX;
        const originalScrollY = window.scrollY;
        console.log('💾 Overlay - Storing original scroll position:', originalScrollX, originalScrollY);

        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        document.body.style.overflow = 'hidden'; // Prevent scrolling during selection

        const preventContextMenu = (e: Event) => e.preventDefault();
        const preventScroll = (e: Event) => {
            e.preventDefault();
            window.scrollTo(originalScrollX, originalScrollY);
        };

        document.addEventListener('contextmenu', preventContextMenu);
        document.addEventListener('scroll', preventScroll, { passive: false });
        document.addEventListener('wheel', preventScroll, { passive: false });
        document.addEventListener('touchmove', preventScroll, { passive: false });

        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('contextmenu', preventContextMenu);
            document.removeEventListener('scroll', preventScroll);
            document.removeEventListener('wheel', preventScroll);
            document.removeEventListener('touchmove', preventScroll);

            // Restore text selection and scrolling
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            document.body.style.overflow = '';

            // Ensure we're back at the original position
            window.scrollTo(originalScrollX, originalScrollY);
        };
    }, [isSelecting, handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown]);

    if (!mounted || !isSelecting) return null;

    const overlayContent = (
        <>
            {/* Full page overlay */}
            <div
                className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-[1px]"
                style={{
                    cursor: 'crosshair',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    position: 'fixed'
                }}
            />

            {/* Selection rectangle */}
            {currentSelection && (
                <div
                    className="fixed z-[10000] border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
                    style={{
                        left: currentSelection.x - window.scrollX,
                        top: currentSelection.y - window.scrollY,
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

            {/* Instructions overlay */}
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10001] bg-black/80 text-white text-sm px-4 py-3 rounded-lg backdrop-blur-sm shadow-lg border border-white/20 pointer-events-none">
                <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <span className="font-medium">Screenshot Mode - Select Any Area</span>
                </div>
                <div className="text-xs text-gray-200 space-y-1 text-center">
                    <div>Drag anywhere on the page to select content</div>
                    <div>Press <kbd className="bg-white/20 px-1 rounded text-white">Esc</kbd> to cancel</div>
                </div>
            </div>

            {/* Selection hint when drawing */}
            {currentSelection && (
                <div className="fixed top-4 right-4 z-[10001] bg-blue-600/90 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm shadow-lg pointer-events-none">
                    <div className="font-medium">Selection: {Math.round(currentSelection.width)} × {Math.round(currentSelection.height)}px</div>
                    <div className="text-blue-200 mt-1">Release to capture & analyze</div>
                </div>
            )}
        </>
    );

    // Try rendering without portal first to debug scroll issue
    return overlayContent;
}