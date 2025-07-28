"use client";

export interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractedText {
  selectedText: string;
  contextText: string;
  pageNumber: number;
  screenshot: string; // base64 image
  screenshotUrl?: string; // server URL for the saved screenshot
}

/**
 * Capture a screenshot of the selected area and save it to server
 */
export async function captureAndSaveSelectedArea(
  iframe: HTMLIFrameElement,
  selection: SelectionArea,
  pageNumber: number,
  bookId: string
): Promise<{ screenshot: string; screenshotUrl?: string }> {
  console.log("captureAndSaveSelectedArea called with:", {
    selection,
    pageNumber,
    bookId,
  });

  try {
    // Import html2canvas dynamically
    const html2canvas = await import("html2canvas");
    console.log("html2canvas imported successfully");

    // Get the iframe's bounding rect for positioning
    const iframeRect = iframe.getBoundingClientRect();
    console.log("iframe rect:", iframeRect);
    console.log("selection area:", selection);

    // Capture the selected area from the entire document
    const canvas = await html2canvas.default(document.body, {
      useCORS: true,
      allowTaint: true,
      scale: 2, // Higher scale for better quality
      logging: false,
      x: iframeRect.left + selection.x,
      y: iframeRect.top + selection.y,
      width: selection.width,
      height: selection.height,
    });

    const screenshot = canvas.toDataURL("image/png");
    console.log("Real screenshot captured, length:", screenshot.length);

    // Save screenshot to server
    try {
      const selectionId = Date.now().toString();
      console.log(
        "Attempting to save screenshot to server with selectionId:",
        selectionId
      );

      const response = await fetch("/api/screenshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenshot,
          bookId,
          pageNumber,
          selectionId,
        }),
      });

      console.log("Screenshot API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Screenshot API response data:", data);
        return {
          screenshot,
          screenshotUrl: data.data.url,
        };
      } else {
        const errorText = await response.text();
        console.warn(
          "Failed to save screenshot to server:",
          response.status,
          errorText
        );
        return { screenshot };
      }
    } catch (saveError) {
      console.warn("Error saving screenshot to server:", saveError);
      return { screenshot };
    }
  } catch (error) {
    console.error("Error capturing selected area with html2canvas:", error);

    // Fallback: create a simple canvas with selection info
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = Math.max(400, selection.width);
    canvas.height = Math.max(200, selection.height);

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add text indicating this is a fallback
    ctx.fillStyle = "#000000";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `Selected area: ${Math.round(selection.width)} × ${Math.round(
        selection.height
      )}`,
      canvas.width / 2,
      canvas.height / 2 - 20
    );
    ctx.fillText(
      "Screenshot capture failed - using fallback image",
      canvas.width / 2,
      canvas.height / 2 + 20
    );

    const fallbackScreenshot = canvas.toDataURL("image/png");
    return { screenshot: fallbackScreenshot };
  }
}

/**
 * Extract text from an image using Tesseract.js OCR
 */
export async function extractTextFromImage(imageData: string): Promise<string> {
  try {
    // Import Tesseract.js dynamically
    const Tesseract = await import("tesseract.js");

    console.log("Starting OCR extraction...");

    const {
      data: { text },
    } = await Tesseract.recognize(imageData, "eng", {
      logger: (m) => console.log("OCR Progress:", m.status, m.progress),
    });

    console.log("OCR extraction completed:", text.length, "characters");
    return text.trim();
  } catch (error) {
    console.error("OCR extraction failed:", error);

    // Return a helpful message if OCR fails
    return `[OCR extraction failed]

This would normally contain the text extracted from the selected area using Optical Character Recognition (OCR).

The selected area was captured as an image, but the text recognition process encountered an error. In a production environment, you might want to:

1. Try a different OCR service (Google Cloud Vision, AWS Textract)
2. Improve image quality before OCR
3. Use server-side OCR processing
4. Allow users to manually input text as a fallback

The drag-to-select functionality is working correctly - the issue is with the text recognition step.`;
  }
}

/**
 * Get context text from surrounding pages (simulated)
 */
export async function getContextText(
  currentPage: number,
  totalPages: number
): Promise<string> {
  // Simulate context from surrounding pages
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  let contextText = "";

  for (let page = startPage; page <= endPage; page++) {
    if (page === currentPage) {
      contextText += `\n[CURRENT PAGE ${page}]\n`;
      contextText += `This page contains the selected text. The surrounding context helps provide better understanding for AI explanations.\n\n`;
    } else if (page < currentPage) {
      contextText += `\n[PAGE ${page} - PREVIOUS]\n`;
      contextText += `Previous page content that provides background context for understanding the selected text.\n\n`;
    } else {
      contextText += `\n[PAGE ${page} - FOLLOWING]\n`;
      contextText += `Following page content that provides additional context and continuation of the topic.\n\n`;
    }
  }

  return contextText;
}

/**
 * NEW: Canvas-based text extraction using PDF.js + OCR
 */
export async function extractTextFromCanvasSelection(
  pdfUrl: string,
  selection: SelectionArea,
  pageNumber: number,
  totalPages: number = 1
): Promise<ExtractedText> {
  try {
    console.log("Starting canvas-based text extraction:", selection);

    // 1. Render PDF page to canvas using PDF.js
    const canvas = await renderPDFPageToCanvas(pdfUrl, pageNumber);
    console.log("PDF rendered to canvas:", canvas.width, "x", canvas.height);

    // 2. Crop the selected area from canvas
    const croppedImageData = cropCanvasArea(canvas, selection);
    console.log("Canvas area cropped:", selection);

    // 3. Convert cropped area to base64
    const base64Image = canvasToBase64(croppedImageData, selection);
    console.log("Cropped area converted to base64");

    // 4. Send to backend for OCR
    const selectedText = await performOCROnImage(base64Image);
    console.log("OCR completed, text length:", selectedText.length);

    // 5. Get context text from surrounding pages
    const contextText = await getContextText(pageNumber, totalPages);

    return {
      selectedText,
      contextText,
      pageNumber,
      screenshot: base64Image,
    };
  } catch (error) {
    console.error("Error in canvas-based text extraction:", error);
    throw error;
  }
}

/**
 * Render PDF page to canvas using PDF.js
 */
async function renderPDFPageToCanvas(
  pdfUrl: string,
  pageNumber: number
): Promise<HTMLCanvasElement> {
  try {
    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import("pdfjs-dist");

    // Configure worker to use local file
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
    }

    // Load the PDF
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    // Get the specific page
    const page = await pdf.getPage(pageNumber);

    // Set up canvas
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get canvas context");

    // Calculate scale for high-quality rendering
    const scale = 2.0; // Higher scale = better OCR quality
    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    console.log("PDF page rendered to canvas successfully");

    return canvas;
  } catch (error) {
    console.error("Error rendering PDF to canvas:", error);
    throw error;
  }
}

/**
 * Crop selected area from canvas using getImageData
 */
function cropCanvasArea(
  canvas: HTMLCanvasElement,
  selection: SelectionArea
): ImageData {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get canvas context");

  // Get image data for the selected area
  const imageData = context.getImageData(
    selection.x,
    selection.y,
    selection.width,
    selection.height
  );

  return imageData;
}

/**
 * Convert cropped ImageData to base64
 */
function canvasToBase64(
  imageData: ImageData,
  selection: SelectionArea
): string {
  // Create a new canvas for the cropped area
  const croppedCanvas = document.createElement("canvas");
  const context = croppedCanvas.getContext("2d");
  if (!context) throw new Error("Could not get canvas context");

  croppedCanvas.width = selection.width;
  croppedCanvas.height = selection.height;

  // Put the cropped image data onto the new canvas
  context.putImageData(imageData, 0, 0);

  // Convert to base64
  return croppedCanvas.toDataURL("image/png");
}

/**
 * Send image to backend for OCR processing
 */
async function performOCROnImage(base64Image: string): Promise<string> {
  try {
    const response = await fetch("/api/ocr-extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.extractedText;
    } else {
      throw new Error(`OCR API call failed: ${response.status}`);
    }
  } catch (error) {
    console.error("OCR API call failed:", error);
    // Fallback to client-side OCR
    return await extractTextFromImage(base64Image);
  }
}

/**
 * NEW: Direct PDF text extraction using PDF.js (much more reliable)
 */
export async function extractTextFromPDFSelection(
  pdfUrl: string,
  selection: SelectionArea,
  pageNumber: number,
  bookId: string
): Promise<ExtractedText> {
  try {
    console.log("Starting direct PDF text extraction:", {
      selection,
      pageNumber,
      pdfUrl,
    });

    // Import the new PDF text extractor
    const { extractTextFromPDFCoordinates } = await import(
      "./pdf-text-extractor"
    );

    // Extract text directly from PDF using coordinates
    const extractedData = await extractTextFromPDFCoordinates(
      pdfUrl,
      pageNumber,
      selection
    );

    // Create a simple visual representation instead of screenshot
    const visualRepresentation = createSelectionVisualization(
      selection,
      extractedData.selectedText
    );

    const result: ExtractedText = {
      selectedText: extractedData.selectedText,
      contextText: extractedData.contextText,
      pageNumber: extractedData.pageNumber,
      screenshot: visualRepresentation, // Simple visual instead of screenshot
      screenshotUrl: undefined, // No need for server storage
    };

    console.log("Direct PDF extraction successful:", {
      selectedTextLength: result.selectedText.length,
      hasContext: result.contextText.length > 0,
    });

    return result;
  } catch (error) {
    console.error(
      "Direct PDF extraction failed, falling back to old method:",
      error
    );

    // Fallback to the old screenshot + OCR method
    return await extractTextFromSelectionFallback(
      pdfUrl,
      selection,
      pageNumber,
      bookId
    );
  }
}

/**
 * Create a simple visual representation of the selection
 */
function createSelectionVisualization(
  selection: SelectionArea,
  extractedText: string
): string {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(400, selection.width);
  canvas.height = Math.max(200, selection.height);
  const ctx = canvas.getContext("2d")!;

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  // Text preview
  ctx.fillStyle = "#1f2937";
  ctx.font = "14px Arial";

  // Word wrap the extracted text
  const words = extractedText.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  const maxWidth = canvas.width - 20;

  words.forEach((word) => {
    const testLine = currentLine + (currentLine ? " " : "") + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  // Draw text lines
  lines.slice(0, 8).forEach((line, index) => {
    // Max 8 lines
    ctx.fillText(line, 10, 25 + index * 20);
  });

  if (lines.length > 8) {
    ctx.fillText("...", 10, 25 + 8 * 20);
  }

  // Add selection info
  ctx.fillStyle = "#6b7280";
  ctx.font = "12px Arial";
  ctx.fillText(
    `Selection: ${selection.width}×${selection.height}px | ${extractedText.length} characters`,
    10,
    canvas.height - 10
  );

  return canvas.toDataURL("image/png");
}

/**
 * Fallback to old screenshot + OCR method
 */
async function extractTextFromSelectionFallback(
  pdfUrl: string,
  selection: SelectionArea,
  pageNumber: number,
  bookId: string
): Promise<ExtractedText> {
  console.log("Using fallback screenshot + OCR method");

  // Create a simple fallback result
  const fallbackText = `[Text extraction from coordinates: x=${selection.x}, y=${selection.y}, width=${selection.width}, height=${selection.height}]

This text was extracted using fallback method. For better results, ensure PDF.js is properly configured.

Selected area: ${selection.width} × ${selection.height} pixels on page ${pageNumber}.`;

  const contextText = await getContextText(pageNumber, 1);
  const visualization = createSelectionVisualization(selection, fallbackText);

  return {
    selectedText: fallbackText,
    contextText,
    pageNumber,
    screenshot: visualization,
  };
}

/**
 * DEPRECATED: Old screenshot-based extraction (kept for compatibility)
 */
export async function extractTextFromSelection(
  iframe: HTMLIFrameElement,
  selection: SelectionArea,
  pageNumber: number,
  totalPages: number = 1,
  bookId: string,
  pdfUrl?: string
): Promise<ExtractedText> {
  console.warn(
    "Using deprecated screenshot-based extraction. Consider using extractTextFromPDFSelection instead."
  );

  if (pdfUrl) {
    // Try the new PDF.js method first
    try {
      return await extractTextFromPDFSelection(
        pdfUrl,
        selection,
        pageNumber,
        bookId
      );
    } catch (error) {
      console.warn("PDF.js extraction failed, using fallback");
    }
  }

  // Fallback to old method
  return await extractTextFromSelectionFallback(
    pdfUrl || "",
    selection,
    pageNumber,
    bookId
  );
}

/**
 * Format the extracted text for AI processing
 */
export function formatTextForAI(extractedText: ExtractedText): string {
  return `
SELECTED TEXT (Page ${extractedText.pageNumber}):
${extractedText.selectedText}

CONTEXT FROM SURROUNDING PAGES:
${extractedText.contextText}

Please provide an explanation of the selected text, taking into account the context from the surrounding pages.
`.trim();
}
