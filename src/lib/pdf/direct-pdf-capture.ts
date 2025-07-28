"use client";

import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
}

export interface PDFSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PDFCaptureResult {
  selectedText: string;
  contextText: string;
  pageNumber: number;
  screenshot: string;
  screenshotUrl?: string;
}

/**
 * EFFICIENT SOLUTION: Render PDF page directly and capture selection
 * This bypasses iframe restrictions completely!
 */
export async function captureFromPDFDirect(
  pdfUrl: string,
  pageNumber: number,
  selection: PDFSelection,
  bookId: string
): Promise<PDFCaptureResult> {
  try {
    console.log("Starting direct PDF capture:", {
      pdfUrl,
      pageNumber,
      selection,
    });

    // 1. Load and render the PDF page directly to canvas
    const { pageCanvas, textContent } = await renderPDFPageWithText(
      pdfUrl,
      pageNumber
    );
    console.log("PDF page rendered successfully");

    // 2. Crop the selection area from the rendered canvas
    const selectionCanvas = cropCanvasArea(pageCanvas, selection);
    const screenshot = selectionCanvas.toDataURL("image/png");
    console.log("Selection cropped from PDF canvas");

    // 3. Extract text from the selection area using PDF text data
    let selectedText = extractTextFromPDFArea(
      textContent,
      selection,
      pageCanvas
    );
    console.log(
      "Text extracted from PDF data:",
      selectedText.substring(0, 100)
    );

    // 4. If PDF text extraction failed, use OCR on the screenshot
    if (!selectedText || selectedText.trim().length === 0) {
      console.log("PDF text extraction failed, trying OCR...");
      try {
        selectedText = await extractTextFromScreenshotOCR(screenshot);
        console.log(
          "OCR extraction successful:",
          selectedText.substring(0, 100)
        );
      } catch (ocrError) {
        console.warn("OCR extraction also failed:", ocrError);
        selectedText = `I can see you've selected an area of the PDF (${selection.width}×${selection.height} pixels), but I'm having trouble extracting the text automatically. 

Could you please type or copy-paste the text from the selected area so I can explain it to you?

For example:
- "Explain this formula: E = mc²"
- "What does this paragraph mean: [paste text here]"
- "Help me understand: [describe what you see]"`;
      }
    }

    // 5. Get context from surrounding pages
    const contextText = await getPDFContext(pdfUrl, pageNumber);

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
    console.error("Direct PDF capture failed:", error);
    throw error;
  }
}

/**
 * Render PDF page to canvas and extract text content
 */
async function renderPDFPageWithText(pdfUrl: string, pageNumber: number) {
  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument(pdfUrl);
  const pdf = await loadingTask.promise;

  // Get the specific page
  const page = await pdf.getPage(pageNumber);

  // Set up canvas with high resolution
  const scale = 2.0; // High resolution for better quality
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

  // Get text content with positions
  const textContent = await page.getTextContent();

  return { pageCanvas: canvas, textContent };
}

/**
 * Crop the selection area from the canvas
 */
function cropCanvasArea(
  sourceCanvas: HTMLCanvasElement,
  selection: PDFSelection
): HTMLCanvasElement {
  const croppedCanvas = document.createElement("canvas");
  const ctx = croppedCanvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  // Scale selection coordinates to match the high-resolution canvas
  const scale = 2.0; // Same scale used in rendering
  const scaledSelection = {
    x: selection.x * scale,
    y: selection.y * scale,
    width: selection.width * scale,
    height: selection.height * scale,
  };

  croppedCanvas.width = scaledSelection.width;
  croppedCanvas.height = scaledSelection.height;

  // Draw the selected area from source canvas
  ctx.drawImage(
    sourceCanvas,
    scaledSelection.x,
    scaledSelection.y,
    scaledSelection.width,
    scaledSelection.height,
    0,
    0,
    scaledSelection.width,
    scaledSelection.height
  );

  return croppedCanvas;
}

/**
 * Extract text from PDF text content based on selection area
 */
function extractTextFromPDFArea(
  textContent: any,
  selection: PDFSelection,
  canvas: HTMLCanvasElement
): string {
  console.log("Extracting text from PDF area:", {
    selection,
    canvasSize: { width: canvas.width, height: canvas.height },
  });

  const scale = 2.0; // Canvas scale factor
  const canvasHeight = canvas.height;

  // Convert selection to PDF coordinates (PDF uses bottom-left origin)
  const pdfSelection = {
    x: selection.x * scale,
    y: canvasHeight - selection.y * scale - selection.height * scale,
    width: selection.width * scale,
    height: selection.height * scale,
  };

  console.log("PDF selection coordinates:", pdfSelection);

  const selectedTextItems: string[] = [];
  let totalTextItems = 0;

  textContent.items.forEach((item: any, index: number) => {
    if (item.str && item.transform) {
      totalTextItems++;
      const [scaleX, skewX, skewY, scaleY, translateX, translateY] =
        item.transform;

      // Calculate text item bounding box
      const textBox = {
        x: translateX,
        y: translateY,
        width: item.width || item.str.length * Math.abs(scaleX) * 0.6,
        height: Math.abs(scaleY),
      };

      // Check if text item intersects with selection
      if (isBoxIntersecting(textBox, pdfSelection)) {
        selectedTextItems.push(item.str);
        console.log(`Found intersecting text [${index}]:`, item.str, textBox);
      }
    }
  });

  console.log(
    `Total text items: ${totalTextItems}, Selected: ${selectedTextItems.length}`
  );

  // If no text found with strict intersection, try a more lenient approach
  if (selectedTextItems.length === 0) {
    console.log("No strict intersections found, trying lenient approach...");

    textContent.items.forEach((item: any) => {
      if (item.str && item.transform) {
        const [scaleX, skewX, skewY, scaleY, translateX, translateY] =
          item.transform;

        const textBox = {
          x: translateX,
          y: translateY,
          width: item.width || item.str.length * Math.abs(scaleX) * 0.6,
          height: Math.abs(scaleY),
        };

        // Check if text center is within selection area
        const textCenterX = textBox.x + textBox.width / 2;
        const textCenterY = textBox.y + textBox.height / 2;

        if (
          textCenterX >= pdfSelection.x &&
          textCenterX <= pdfSelection.x + pdfSelection.width &&
          textCenterY >= pdfSelection.y &&
          textCenterY <= pdfSelection.y + pdfSelection.height
        ) {
          selectedTextItems.push(item.str);
          console.log("Found text with center-point method:", item.str);
        }
      }
    });
  }

  const result = selectedTextItems.join(" ").trim();
  console.log("Final extracted text:", result);
  return result;
}

/**
 * Check if two bounding boxes intersect
 */
function isBoxIntersecting(box1: any, box2: any): boolean {
  return !(
    box1.x + box1.width < box2.x ||
    box2.x + box2.width < box1.x ||
    box1.y + box1.height < box2.y ||
    box2.y + box2.height < box1.y
  );
}

/**
 * Extract text from screenshot using OCR as fallback
 */
async function extractTextFromScreenshotOCR(
  screenshot: string
): Promise<string> {
  try {
    console.log("Starting OCR extraction as fallback...");

    // Try server-side OCR first
    try {
      const response = await fetch("/api/ocr-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: screenshot }),
      });

      if (response.ok) {
        const result = await response.json();
        const extractedText = result.extractedText || "";
        console.log(
          "Server-side OCR successful, text length:",
          extractedText.length
        );
        return extractedText;
      }
    } catch (serverError) {
      console.warn("Server-side OCR failed, trying client-side:", serverError);
    }

    // Fallback to client-side OCR
    const Tesseract = await import("tesseract.js");
    console.log("Starting client-side OCR with Tesseract...");

    const {
      data: { text },
    } = await Tesseract.recognize(screenshot, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    console.log("Client-side OCR completed, text length:", text.length);
    return text.trim();
  } catch (error) {
    console.error("OCR extraction failed:", error);
    throw error;
  }
}

/**
 * Get context from surrounding pages
 */
async function getPDFContext(
  pdfUrl: string,
  pageNumber: number
): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    const contextParts: string[] = [];

    // Get text from previous page
    if (pageNumber > 1) {
      try {
        const prevPage = await pdf.getPage(pageNumber - 1);
        const textContent = await prevPage.getTextContent();
        const prevText = textContent.items
          .map((item: any) => item.str)
          .join(" ")
          .trim();
        contextParts.push(`[Previous page]: ${prevText.substring(0, 500)}...`);
      } catch (error) {
        console.warn("Could not get previous page:", error);
      }
    }

    // Get text from next page
    if (pageNumber < pdf.numPages) {
      try {
        const nextPage = await pdf.getPage(pageNumber + 1);
        const textContent = await nextPage.getTextContent();
        const nextText = textContent.items
          .map((item: any) => item.str)
          .join(" ")
          .trim();
        contextParts.push(`[Next page]: ${nextText.substring(0, 500)}...`);
      } catch (error) {
        console.warn("Could not get next page:", error);
      }
    }

    return contextParts.join("\n\n");
  } catch (error) {
    console.error("Error getting PDF context:", error);
    return `[Context from page ${pageNumber}]`;
  }
}
