'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Download,
    ExternalLink,
    Loader2,
    AlertCircle,
    Maximize,
    Minimize
} from 'lucide-react';
import ScreenshotCapture from './ScreenshotCapture';
// Import PDF.js with proper client-side handling
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker only on client side
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface CustomPDFViewerProps {
    fileUrl: string;
    title?: string;

    bookId?: string;
    onPageChange?: (pageNumber: number) => void;
    onTextSelect?: (extractedText: any) => void;
    // Screenshot props
    isSelecting?: boolean;
    isExtracting?: boolean;
    onToggleScreenshot?: () => void;
    onCancelScreenshot?: () => void;
}

export default function CustomPDFViewer({
    fileUrl,
    title = 'PDF Document',
    onPageChange,
    isSelecting = false,
    isExtracting = false,
    onToggleScreenshot,
    onCancelScreenshot
}: CustomPDFViewerProps) {
    const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.2);
    const [rotation, setRotation] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [pageInput, setPageInput] = useState('1');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load PDF document
    useEffect(() => {
        const loadPDF = async () => {
            try {
                setIsLoading(true);
                setError(null);

                console.log('Loading PDF:', fileUrl);

                const loadingTask = pdfjsLib.getDocument(fileUrl);
                const pdfDoc = await loadingTask.promise;

                setPdf(pdfDoc);
                setTotalPages(pdfDoc.numPages);
                setCurrentPage(1);
                setPageInput('1');

                console.log('PDF loaded successfully:', {
                    numPages: pdfDoc.numPages,
                    title: title
                });
            } catch (err) {
                console.error('Error loading PDF:', err);
                setError('Failed to load PDF. Please check the file and try again.');
            } finally {
                setIsLoading(false);
            }
        };

        if (fileUrl) {
            loadPDF();
        }
    }, [fileUrl, title]);

    // Keep track of current render task to cancel if needed
    const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

    // Render current page
    const renderPage = useCallback(async (pageNum: number) => {
        if (!pdf || !canvasRef.current) return;

        try {
            // Cancel any ongoing render task
            if (renderTaskRef.current) {
                console.log('Cancelling previous render task');
                renderTaskRef.current.cancel();
                renderTaskRef.current = null;
            }

            console.log('Rendering page:', pageNum);
            const page = await pdf.getPage(pageNum);
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (!context) {
                throw new Error('Could not get canvas context');
            }

            // Calculate viewport with current scale and rotation
            const viewport = page.getViewport({ scale, rotation });

            // Set canvas dimensions
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            // Clear canvas completely and fill with white background
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);

            // Render page
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            // Store the render task so we can cancel it if needed
            const renderTask = page.render(renderContext);
            renderTaskRef.current = renderTask;

            await renderTask.promise;

            // Force a repaint to ensure the canvas is updated
            canvas.style.display = 'none';
            canvas.offsetHeight; // Trigger reflow
            canvas.style.display = '';

            // Clear the render task reference on successful completion
            renderTaskRef.current = null;

            console.log('Page rendered successfully:', pageNum);

            // Notify parent component of page change
            if (onPageChange) {
                onPageChange(pageNum);
            }
        } catch (err: any) {
            // Don't log cancellation errors as they're expected
            if (err.name !== 'RenderingCancelledException') {
                console.error('Error rendering page:', err);
                setError(`Failed to render page ${pageNum}`);
            }

            // Clear the render task reference
            renderTaskRef.current = null;
        }
    }, [pdf, scale, rotation, onPageChange]);

    // Render page when dependencies change
    useEffect(() => {
        if (pdf && currentPage) {
            console.log('🔄 Page change detected, forcing re-render:', currentPage);
            // Add a small delay to ensure any previous operations are complete
            setTimeout(() => {
                renderPage(currentPage);
            }, 50);
        }
    }, [pdf, currentPage, scale, rotation, renderPage]);

    // Cleanup: Cancel any pending render tasks on unmount
    useEffect(() => {
        return () => {
            if (renderTaskRef.current) {
                console.log('Cancelling render task on unmount');
                renderTaskRef.current.cancel();
                renderTaskRef.current = null;
            }
        };
    }, []);

    // Listen for fullscreen changes (when user presses Escape or uses browser controls)
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
                (document as unknown as { msFullscreenElement?: Element }).msFullscreenElement
            );
            setIsFullscreen(isCurrentlyFullscreen);
        };

        // Add event listeners for different browsers
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Navigation functions
    const goToPage = (pageNum: number) => {
        if (pageNum >= 1 && pageNum <= totalPages) {
            setCurrentPage(pageNum);
            setPageInput(pageNum.toString());
        }
    };

    const nextPage = () => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    };

    const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPageInput(e.target.value);
    };

    const handlePageInputSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const pageNum = parseInt(pageInput, 10);
        if (!isNaN(pageNum)) {
            goToPage(pageNum);
        } else {
            setPageInput(currentPage.toString());
        }
    };

    // Zoom functions
    const zoomIn = () => {
        setScale(prev => Math.min(prev * 1.2, 3.0));
    };

    const zoomOut = () => {
        setScale(prev => Math.max(prev / 1.2, 0.5));
    };

    const resetZoom = () => {
        setScale(1.2);
    };

    // Rotation
    const rotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    // Other functions
    const toggleFullscreen = async () => {
        try {
            if (!isFullscreen) {
                // Enter fullscreen
                if (containerRef.current?.requestFullscreen) {
                    await containerRef.current.requestFullscreen();
                } else if ((containerRef.current as unknown as { webkitRequestFullscreen?: () => Promise<void> })?.webkitRequestFullscreen) {
                    // Safari support
                    await (containerRef.current as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
                } else if ((containerRef.current as unknown as { msRequestFullscreen?: () => Promise<void> })?.msRequestFullscreen) {
                    // IE/Edge support
                    await (containerRef.current as unknown as { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen();
                }
                setIsFullscreen(true);
            } else {
                // Exit fullscreen
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
                    // Safari support
                    await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
                } else if ((document as unknown as { msExitFullscreen?: () => Promise<void> }).msExitFullscreen) {
                    // IE/Edge support
                    await (document as unknown as { msExitFullscreen: () => Promise<void> }).msExitFullscreen();
                }
                setIsFullscreen(false);
            }
        } catch (error) {
            console.error('Fullscreen toggle failed:', error);
            // Fallback to CSS-only fullscreen if browser API fails
            setIsFullscreen(!isFullscreen);
        }
    };

    const downloadPDF = () => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = title + '.pdf';
        link.click();
    };

    const openInNewTab = () => {
        window.open(fileUrl, '_blank');
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle shortcuts if user is typing in an input
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
                return;
            }

            switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    prevPage();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                case ' ':
                    e.preventDefault();
                    nextPage();
                    break;
                case 'Home':
                    e.preventDefault();
                    goToPage(1);
                    break;
                case 'End':
                    e.preventDefault();
                    goToPage(totalPages);
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    resetZoom();
                    break;
                case 'r':
                    e.preventDefault();
                    rotate();
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, totalPages, goToPage, nextPage, prevPage, toggleFullscreen]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50 dark:bg-gray-900">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error Loading PDF</h3>
                <p className="text-muted-foreground text-center mb-4">{error}</p>
                <div className="flex gap-2">
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Retry
                    </Button>
                    <Button onClick={openInNewTab} variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in New Tab
                    </Button>
                    <Button onClick={downloadPDF} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}`}>
            {/* PDF Controls */}
            <div className="flex items-center justify-between p-4 border-b bg-background">
                <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-sm truncate max-w-xs">{title}</h3>
                    {isLoading && (
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading PDF...
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    {/* Navigation Controls */}
                    <div className="flex items-center space-x-1 border rounded-md p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={prevPage}
                            disabled={currentPage <= 1 || isLoading}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <form onSubmit={handlePageInputSubmit} className="flex items-center">
                            <Input
                                type="text"
                                value={pageInput}
                                onChange={handlePageInputChange}
                                className="w-12 h-8 text-center text-xs border-0 bg-transparent"
                                disabled={isLoading}
                            />
                        </form>

                        <span className="text-xs text-muted-foreground px-1">
                            / {totalPages}
                        </span>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={nextPage}
                            disabled={currentPage >= totalPages || isLoading}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center space-x-1 border rounded-md p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={zoomOut}
                            disabled={isLoading}
                            className="h-8 w-8 p-0"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>

                        <span className="text-xs text-muted-foreground px-2 min-w-[3rem] text-center">
                            {Math.round(scale * 100)}%
                        </span>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={zoomIn}
                            disabled={isLoading}
                            className="h-8 w-8 p-0"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </div>



                    {/* Other Controls */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={rotate}
                        disabled={isLoading}
                        className="h-8 w-8 p-0"
                    >
                        <RotateCw className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" size="sm" onClick={downloadPDF}>
                        <Download className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" size="sm" onClick={openInNewTab}>
                        <ExternalLink className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>

                    {/* Screenshot Control */}
                    {onToggleScreenshot && (
                        <ScreenshotCapture
                            isActive={isSelecting}
                            isProcessing={isExtracting}
                            onToggle={onToggleScreenshot}
                            onCancel={onCancelScreenshot || (() => { })}
                        />
                    )}
                </div>
            </div>

            {/* PDF Content */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-4"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Loading PDF...</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <canvas
                            ref={canvasRef}
                            className="shadow-lg bg-white max-w-full h-auto"
                            style={{
                                maxWidth: '100%',
                                height: 'auto'
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="px-4 py-2 border-t bg-muted/50 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <span>Use arrow keys or click buttons to navigate</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">
                            Shortcuts: <kbd className="bg-white/50 px-1 rounded">+/-</kbd> zoom, <kbd className="bg-white/50 px-1 rounded">R</kbd> rotate, <kbd className="bg-white/50 px-1 rounded">F</kbd> fullscreen
                        </span>
                    </div>
                    <span>Page {currentPage} of {totalPages}</span>
                </div>
            </div>
        </div>
    );
}