"use client";

import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
}

export interface PDFTextSelection {
  text: string;
  pageNumber: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ExtractedPDFText {
  selectedText: string;
  contextText: string;
  pageNumber: number;
  totalPages: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Extract text directly from PDF using PDF.js at specific coordinates
 */
export async function extractTextFromPDFCoordinates(
  pdfUrl: string,
  pageNumber: number,
  selectionBox: { x: number; y: number; width: number; height: number }
): Promise<ExtractedPDFText> {
  try {
    console.log("Loading PDF for text extraction:", pdfUrl);

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    console.log("PDF loaded, total pages:", pdf.numPages);

    // Get the specific page
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.0 });

    console.log("Page viewport:", viewport.width, "x", viewport.height);

    // Get text content with positions
    const textContent = await page.getTextContent();

    // Convert selection coordinates to PDF coordinates
    // Note: PDF coordinates start from bottom-left, web coordinates from top-left
    const pdfSelectionBox = {
      x: selectionBox.x,
      y: viewport.height - selectionBox.y - selectionBox.height, // Flip Y coordinate
      width: selectionBox.width,
      height: selectionBox.height,
    };

    console.log("Selection box (web coords):", selectionBox);
    console.log("Selection box (PDF coords):", pdfSelectionBox);

    // Extract text items that intersect with selection
    const selectedTextItems: string[] = [];
    const contextTextItems: string[] = [];

    textContent.items.forEach((item: any) => {
      if (item.str && item.transform) {
        const [scaleX, skewX, skewY, scaleY, translateX, translateY] =
          item.transform;

        // Calculate text item bounding box
        const textBox = {
          x: translateX,
          y: translateY,
          width: item.width || item.str.length * 6, // Approximate width
          height: item.height || Math.abs(scaleY),
        };

        // Check if text item intersects with selection
        if (isIntersecting(textBox, pdfSelectionBox)) {
          selectedTextItems.push(item.str);
        }

        // Also collect nearby text for context (within 100px)
        const distance = Math.sqrt(
          Math.pow(
            textBox.x - (pdfSelectionBox.x + pdfSelectionBox.width / 2),
            2
          ) +
            Math.pow(
              textBox.y - (pdfSelectionBox.y + pdfSelectionBox.height / 2),
              2
            )
        );

        if (distance < 200) {
          // Within 200px for context
          contextTextItems.push(item.str);
        }
      }
    });

    // Get context from surrounding pages
    const contextPages = await getContextFromSurroundingPages(pdf, pageNumber);

    const result: ExtractedPDFText = {
      selectedText: selectedTextItems.join(" ").trim(),
      contextText: `${contextPages}\n\nCurrent page context: ${contextTextItems.join(
        " "
      )}`,
      pageNumber,
      totalPages: pdf.numPages,
      boundingBox: selectionBox,
    };

    console.log("Extracted text result:", {
      selectedTextLength: result.selectedText.length,
      contextTextLength: result.contextText.length,
      selectedText: result.selectedText.substring(0, 100) + "...",
    });

    return result;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Check if two bounding boxes intersect
 */
function isIntersecting(box1: any, box2: any): boolean {
  return !(
    box1.x + box1.width < box2.x ||
    box2.x + box2.width < box1.x ||
    box1.y + box1.height < box2.y ||
    box2.y + box2.height < box1.y
  );
}

/**
 * Get context text from surrounding pages
 */
async function getContextFromSurroundingPages(
  pdf: any,
  currentPage: number
): Promise<string> {
  const contextPages: string[] = [];

  // Get text from previous page
  if (currentPage > 1) {
    try {
      const prevPage = await pdf.getPage(currentPage - 1);
      const prevTextContent = await prevPage.getTextContent();
      const prevText = prevTextContent.items
        .map((item: any) => item.str)
        .join(" ")
        .trim();
      contextPages.push(`[Previous page]: ${prevText.substring(0, 500)}...`);
    } catch (error) {
      console.warn("Could not get previous page context:", error);
    }
  }

  // Get text from next page
  if (currentPage < pdf.numPages) {
    try {
      const nextPage = await pdf.getPage(currentPage + 1);
      const nextTextContent = await nextPage.getTextContent();
      const nextText = nextTextContent.items
        .map((item: any) => item.str)
        .join(" ")
        .trim();
      contextPages.push(`[Next page]: ${nextText.substring(0, 500)}...`);
    } catch (error) {
      console.warn("Could not get next page context:", error);
    }
  }

  return contextPages.join("\n\n");
}

/**
 * Get current page number from PDF viewer (if available)
 */
export function getCurrentPageFromPDFViewer(iframe: HTMLIFrameElement): number {
  try {
    // Try to get page number from PDF viewer URL hash
    const src = iframe.src;
    const pageMatch = src.match(/page=(\d+)/);
    if (pageMatch) {
      return parseInt(pageMatch[1]);
    }

    // Default to page 1
    return 1;
  } catch (error) {
    console.warn("Could not determine current page:", error);
    return 1;
  }
}

/**
 * Convert selection overlay coordinates to PDF coordinates
 */
export function convertSelectionToPDFCoordinates(
  selection: { x: number; y: number; width: number; height: number },
  iframe: HTMLIFrameElement,
  pdfViewport: { width: number; height: number }
): { x: number; y: number; width: number; height: number } {
  const iframeRect = iframe.getBoundingClientRect();

  // Calculate scale factors
  const scaleX = pdfViewport.width / iframeRect.width;
  const scaleY = pdfViewport.height / iframeRect.height;

  return {
    x: selection.x * scaleX,
    y: selection.y * scaleY,
    width: selection.width * scaleX,
    height: selection.height * scaleY,
  };
}
