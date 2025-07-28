"use client";

import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
}

export interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractedContent {
  selectedText: string;
  contextText: string;
  pageNumber: number;
  screenshot: string; // base64 image of the selected area
  screenshotUrl?: string;
}

/**
 * Capture the actual visual content from a PDF selection area
 * This renders the PDF page and crops the selected area
 */
export async function captureVisualPDFSelection(
  pdfUrl: string,
  pageNumber: number,
  selection: SelectionArea,
  bookId: string
): Promise<ExtractedContent> {
  try {
    console.log("Starting visual PDF selection capture:", {
      pdfUrl,
      pageNumber,
      selection,
    });

    // 1. Load and render the PDF page to canvas
    const pageCanvas = await renderPDFPageToCanvas(pdfUrl, pageNumber);
    console.log(
      "PDF page rendered to canvas:",
      pageCanvas.width,
      "x",
      pageCanvas.height
    );

    // 2. Calculate the actual selection coordinates on the rendered canvas
    const scaledSelection = calculateScaledSelection(selection, pageCanvas);
    console.log("Scaled selection coordinates:", scaledSelection);

    // 3. Crop the selected area from the canvas
    const selectionCanvas = cropCanvasSelection(pageCanvas, scaledSelection);
    const screenshot = selectionCanvas.toDataURL("image/png");
    console.log(
      "Selection cropped to canvas, screenshot length:",
      screenshot.length
    );

    // 4. Extract text from the cropped image using OCR
    const selectedText = await extractTextFromImage(screenshot);
    console.log(
      "Text extracted from selection:",
      selectedText.substring(0, 100) + "..."
    );

    // 5. Get context from the full page and surrounding pages
    const contextText = await getPageContext(pdfUrl, pageNumber);

    // 6. Save screenshot to server
    let screenshotUrl: string | undefined;
    try {
      const response = await fetch("/api/screenshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenshot,
          bookId,
          pageNumber,
          selectionId: Date.now().toString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        screenshotUrl = data.data.url;
        console.log("Screenshot saved to server:", screenshotUrl);
      }
    } catch (error) {
      console.warn("Failed to save screenshot:", error);
    }

    return {
      selectedText,
      contextText,
      pageNumber,
      screenshot,
      screenshotUrl,
    };
  } catch (error) {
    console.error("Error in visual PDF selection capture:", error);
    throw error;
  }
}

/**
 * Render a PDF page to canvas using PDF.js
 */
async function renderPDFPageToCanvas(
  pdfUrl: string,
  pageNumber: number
): Promise<HTMLCanvasElement> {
  try {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    // Get the specific page
    const page = await pdf.getPage(pageNumber);

    // Set up canvas with high resolution for better OCR
    const scale = 2.0; // Higher scale = better quality
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get canvas context");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    console.log("PDF page rendered successfully");

    return canvas;
  } catch (error) {
    console.error("Error rendering PDF page:", error);
    throw error;
  }
}

/**
 * Calculate scaled selection coordinates based on canvas size
 */
function calculateScaledSelection(
  selection: SelectionArea,
  canvas: HTMLCanvasElement
): SelectionArea {
  // The selection coordinates are from the PDF viewer overlay
  // We need to scale them to match the rendered canvas

  // For now, assume 1:1 scaling - this might need adjustment based on your PDF viewer
  return {
    x: selection.x * 2, // Scale factor from renderPDFPageToCanvas
    y: selection.y * 2,
    width: selection.width * 2,
    height: selection.height * 2,
  };
}

/**
 * Crop the selected area from the canvas
 */
function cropCanvasSelection(
  sourceCanvas: HTMLCanvasElement,
  selection: SelectionArea
): HTMLCanvasElement {
  const croppedCanvas = document.createElement("canvas");
  const ctx = croppedCanvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  // Set cropped canvas size
  croppedCanvas.width = selection.width;
  croppedCanvas.height = selection.height;

  // Draw the selected area from source canvas to cropped canvas
  ctx.drawImage(
    sourceCanvas,
    selection.x,
    selection.y,
    selection.width,
    selection.height, // Source area
    0,
    0,
    selection.width,
    selection.height // Destination area
  );

  return croppedCanvas;
}

/**
 * Extract text from image using OCR
 */
async function extractTextFromImage(imageData: string): Promise<string> {
  try {
    // Try server-side OCR first
    const response = await fetch("/api/ocr-extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.extractedText || "";
    }
  } catch (error) {
    console.warn("Server-side OCR failed, trying client-side:", error);
  }

  // Fallback to client-side OCR
  try {
    const Tesseract = await import("tesseract.js");
    const {
      data: { text },
    } = await Tesseract.recognize(imageData, "eng", {
      logger: (m) => console.log("OCR Progress:", m.status, m.progress),
    });
    return text.trim();
  } catch (error) {
    console.error("Client-side OCR also failed:", error);
    return "[Text extraction failed - please try selecting a different area]";
  }
}

/**
 * Get context text from the current page and surrounding pages
 */
async function getPageContext(
  pdfUrl: string,
  pageNumber: number
): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    const contextParts: string[] = [];

    // Get text from current page
    try {
      const currentPage = await pdf.getPage(pageNumber);
      const textContent = await currentPage.getTextContent();
      const currentPageText = textContent.items
        .map((item: any) => item.str)
        .join(" ")
        .trim();

      contextParts.push(
        `[Current Page ${pageNumber}]: ${currentPageText.substring(0, 1000)}...`
      );
    } catch (error) {
      console.warn("Could not get current page text:", error);
    }

    // Get text from previous page
    if (pageNumber > 1) {
      try {
        const prevPage = await pdf.getPage(pageNumber - 1);
        const textContent = await prevPage.getTextContent();
        const prevPageText = textContent.items
          .map((item: any) => item.str)
          .join(" ")
          .trim();

        contextParts.push(
          `[Previous Page ${pageNumber - 1}]: ${prevPageText.substring(
            0,
            500
          )}...`
        );
      } catch (error) {
        console.warn("Could not get previous page text:", error);
      }
    }

    // Get text from next page
    if (pageNumber < pdf.numPages) {
      try {
        const nextPage = await pdf.getPage(pageNumber + 1);
        const textContent = await nextPage.getTextContent();
        const nextPageText = textContent.items
          .map((item: any) => item.str)
          .join(" ")
          .trim();

        contextParts.push(
          `[Next Page ${pageNumber + 1}]: ${nextPageText.substring(0, 500)}...`
        );
      } catch (error) {
        console.warn("Could not get next page text:", error);
      }
    }

    return contextParts.join("\n\n");
  } catch (error) {
    console.error("Error getting page context:", error);
    return `[Context from page ${pageNumber} and surrounding pages]`;
  }
}
