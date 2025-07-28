'use client';

import { useState, useEffect } from 'react';
import CustomPDFViewer from './CustomPDFViewer';
import FullPageSelectionOverlay from './FullPageSelectionOverlay';
import AIExplanationModal from '../ai/AIExplanationModal';
import { SelectionArea, ExtractedText } from '@/lib/pdf/text-extraction';
import { captureSimpleScreenshot } from '@/lib/screenshot/simple-capture';

interface SimplePDFViewerProps {
  fileUrl: string;
  title?: string;
  bookId?: string;
  onPageChange?: (pageNumber: number) => void;
  onTextSelect?: (extractedText: ExtractedText) => void;
}

export default function SimplePDFViewer({
  fileUrl,
  title = 'PDF Document',
  bookId,
  onPageChange,
  onTextSelect
}: SimplePDFViewerProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalExtractedText, setModalExtractedText] = useState<ExtractedText | null>(null);

  const toggleSelectionMode = () => {
    console.log('🎯 Toggle selection mode called, current state:', isSelecting);

    if (!isSelecting) {
      // Store current scroll position
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      console.log('💾 Storing scroll position:', scrollX, scrollY);

      setIsSelecting(true);

      // Simple but effective: restore scroll position after re-render
      // Use multiple timing strategies to catch the scroll restoration
      const restoreScroll = () => {
        console.log('🔄 Restoring scroll to:', scrollX, scrollY);
        window.scrollTo(scrollX, scrollY);
      };

      // Try multiple times with different delays to catch the re-render
      setTimeout(restoreScroll, 0);      // Immediate
      setTimeout(restoreScroll, 10);     // After 10ms
      setTimeout(restoreScroll, 50);     // After 50ms
      setTimeout(restoreScroll, 100);    // After 100ms
      requestAnimationFrame(restoreScroll); // Next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(restoreScroll); // Two frames later
      });
    } else {
      setIsSelecting(false);
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPageNumber(pageNumber);
    if (onPageChange) {
      onPageChange(pageNumber);
    }
  };

  const handleSelectionComplete = async (selection: SelectionArea) => {
    console.log('📸 Selection completed:', selection);
    console.log('📋 onTextSelect available:', !!onTextSelect);
    console.log('📚 bookId available:', !!bookId);

    if (!onTextSelect || !bookId) {
      console.warn('❌ Missing onTextSelect or bookId, aborting screenshot');
      return;
    }

    console.log('🚀 Starting screenshot extraction...');
    setIsExtracting(true);
    try {
      // Use the new simple screenshot capture - much more reliable!
      console.log('📸 Calling captureSimpleScreenshot with:', {
        selection,
        bookId,
        currentPageNumber
      });

      const extractedContent = await captureSimpleScreenshot(
        selection,
        bookId,
        currentPageNumber
      );

      console.log('✅ Screenshot capture successful:', extractedContent);

      // Convert to ExtractedText format for compatibility
      const extractedText: ExtractedText = {
        selectedText: extractedContent.selectedText,
        contextText: extractedContent.contextText,
        pageNumber: extractedContent.pageNumber,
        screenshot: extractedContent.screenshot,
        screenshotUrl: extractedContent.screenshotUrl
      };

      // Show the AI explanation modal instead of sidebar
      setModalExtractedText(extractedText);
      setShowModal(true);

      // Also call onTextSelect for backward compatibility (if needed)
      if (onTextSelect) {
        onTextSelect(extractedText);
      }
    } catch (error) {
      console.error('Error extracting text:', error);

      // Show user-friendly error message in modal
      const fallbackText: ExtractedText = {
        selectedText: `I can see you've selected an area of the page, but I'm having trouble extracting the text automatically. 

This could be because the selected area contains:
• Images, diagrams, or graphics
• Complex formatting or layouts
• Browser UI elements
• Very small or unclear text

Could you help me by:
1. Describing what you see in the selected area
2. Copying and pasting any text from the selection
3. Asking a specific question about the content

For example:
• "Explain this diagram showing..."
• "What does this formula mean: [paste formula]"
• "Help me understand this chart/graph"
• "What does this error message mean?"`,
        contextText: 'Full-page screenshot extraction failed - manual input needed',
        pageNumber: currentPageNumber,
        screenshot: '', // Will be handled by the error case
        screenshotUrl: undefined
      };

      // Show the error message in modal too
      setModalExtractedText(fallbackText);
      setShowModal(true);

      // Also call onTextSelect for backward compatibility (if needed)
      if (onTextSelect) {
        onTextSelect(fallbackText);
      }
    } finally {
      setIsExtracting(false);
      setIsSelecting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Escape key - cancel selection
    if (e.key === 'Escape' && isSelecting) {
      setIsSelecting(false);
    }

    // Ctrl/Cmd + Shift + S - toggle screenshot mode
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      if (!isExtracting) {
        toggleSelectionMode();
      }
    }

    // S key (when not typing) - quick screenshot mode
    if (e.key === 's' && !isSelecting && !isExtracting &&
      !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
      e.preventDefault();
      toggleSelectionMode();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelecting, isExtracting]);

  return (
    <div className="relative h-full">
      {/* Custom PDF Viewer */}
      <div className="h-full">
        <CustomPDFViewer
          fileUrl={fileUrl}
          title={title}
          bookId={bookId}
          onPageChange={handlePageChange}
          onTextSelect={onTextSelect}
          isSelecting={isSelecting}
          isExtracting={isExtracting}
          onToggleScreenshot={toggleSelectionMode}
          onCancelScreenshot={() => setIsSelecting(false)}
        />
      </div>

      {/* Full Page Selection Overlay */}
      <FullPageSelectionOverlay
        isSelecting={isSelecting}
        onSelectionComplete={handleSelectionComplete}
        onSelectionStart={() => { }}
        onSelectionEnd={() => { }}
      />

      {/* Debug: Temporary test button */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-[10003]">
          <button
            onClick={() => {
              console.log('🧪 Debug button clicked');
              toggleSelectionMode();
            }}
            className={`px-4 py-2 rounded text-white font-medium ${isSelecting
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
              }`}
          >
            {isSelecting ? 'Cancel Screenshot' : 'Test Screenshot'}
          </button>
        </div>
      )}

      {/* AI Explanation Modal */}
      <AIExplanationModal
        isOpen={showModal}
        extractedText={modalExtractedText}
        onClose={() => {
          setShowModal(false);
          setModalExtractedText(null);
        }}
        onUnderstand={() => {
          setShowModal(false);
          setModalExtractedText(null);
        }}
        bookId={bookId || ''}
      />

      {/* Extraction Loading */}
      {isExtracting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10002]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center max-w-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm font-medium">Capturing screenshot and extracting content...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Full-page screenshot with AI analysis
            </p>
            <div className="mt-4 flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
