"use client";

export interface ScreenshotSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScreenshotResult {
  selectedText: string;
  contextText: string;
  pageNumber: number;
  screenshot: string;
  screenshotUrl?: string;
}

/**
 * Capture screenshot of any area on the current browser tab using html2canvas
 */
export async function captureFullPageSelection(
  selection: ScreenshotSelection,
  bookId: string,
  pageNumber: number = 1
): Promise<ScreenshotResult> {
  try {
    console.log("Starting full page screenshot capture:", {
      selection,
      bookId,
      pageNumber,
    });

    // 1. Import html2canvas dynamically to avoid SSR issues
    const html2canvas = await import("html2canvas");
    console.log("html2canvas imported successfully");

    // 2. Try to capture with minimal options to avoid CSS issues
    console.log("Capturing full page with fallback approach...");

    let fullPageCanvas: HTMLCanvasElement;

    try {
      // Try to find and capture just the PDF canvas directly
      const pdfCanvas = document.querySelector("canvas") as HTMLCanvasElement;
      if (pdfCanvas && pdfCanvas.width > 0 && pdfCanvas.height > 0) {
        console.log("Found PDF canvas, capturing directly...", {
          width: pdfCanvas.width,
          height: pdfCanvas.height,
        });

        // Simple check - just ensure canvas exists and has reasonable size
        console.log("PDF canvas validation passed");

        // Create a new canvas and copy the PDF canvas content
        fullPageCanvas = document.createElement("canvas");
        const ctx = fullPageCanvas.getContext("2d")!;

        // Set canvas size to match viewport
        fullPageCanvas.width = window.innerWidth;
        fullPageCanvas.height = window.innerHeight;

        // Fill with light gray background instead of white to distinguish from blank content
        ctx.fillStyle = "#f8f9fa";
        ctx.fillRect(0, 0, fullPageCanvas.width, fullPageCanvas.height);

        // Get PDF canvas position
        const pdfRect = pdfCanvas.getBoundingClientRect();

        // Only draw if the PDF canvas has reasonable dimensions
        if (pdfRect.width > 0 && pdfRect.height > 0) {
          ctx.drawImage(
            pdfCanvas,
            pdfRect.left,
            pdfRect.top,
            pdfRect.width,
            pdfRect.height
          );
          console.log("PDF canvas copied successfully");
        } else {
          throw new Error("PDF canvas has invalid dimensions");
        }
      } else {
        console.log("No PDF canvas found, trying html2canvas fallback...");

        // Fallback to html2canvas with very minimal options
        fullPageCanvas = await html2canvas.default(document.body, {
          useCORS: false,
          allowTaint: false,
          scale: 0.5, // Lower scale to reduce processing
          logging: false,
          backgroundColor: "#ffffff",
          height: window.innerHeight,
          width: window.innerWidth,
          // Skip problematic elements entirely
          ignoreElements: (element) => {
            const tagName = element.tagName?.toLowerCase();
            const className = element.className || "";

            // Skip all style-related elements
            if (
              tagName === "script" ||
              tagName === "style" ||
              tagName === "link"
            ) {
              return true;
            }

            // Skip elements that might have modern CSS
            if (
              className.includes("gradient") ||
              className.includes("shadow")
            ) {
              return true;
            }

            return false;
          },
        });
      }
    } catch (error) {
      console.warn(
        "All capture attempts failed, creating fallback canvas:",
        error
      );

      // Ultimate fallback: Create a simple canvas with basic content
      fullPageCanvas = document.createElement("canvas");
      const ctx = fullPageCanvas.getContext("2d")!;

      fullPageCanvas.width = window.innerWidth;
      fullPageCanvas.height = window.innerHeight;

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, fullPageCanvas.width, fullPageCanvas.height);

      // Add some basic text
      ctx.fillStyle = "#333333";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "Screenshot capture failed - CSS compatibility issue",
        fullPageCanvas.width / 2,
        fullPageCanvas.height / 2 - 20
      );
      ctx.font = "14px Arial";
      ctx.fillText(
        "Please describe what you see in the selected area",
        fullPageCanvas.width / 2,
        fullPageCanvas.height / 2 + 20
      );
    }

    console.log("Full page captured:", {
      canvasWidth: fullPageCanvas.width,
      canvasHeight: fullPageCanvas.height,
      windowSize: { width: window.innerWidth, height: window.innerHeight },
    });

    // 3. Crop the selected area from the full page canvas
    const croppedCanvas = cropCanvasArea(fullPageCanvas, selection);
    const screenshot = croppedCanvas.toDataURL("image/png");

    console.log("Area cropped successfully:", {
      croppedSize: { width: croppedCanvas.width, height: croppedCanvas.height },
      screenshotLength: screenshot.length,
    });

    // 4. Extract text from the screenshot using OCR
    let selectedText = "";
    try {
      selectedText = await extractTextFromScreenshot(screenshot);
      console.log("OCR extraction successful:", selectedText.substring(0, 100));
    } catch (ocrError) {
      console.warn("OCR extraction failed:", ocrError);
      selectedText = generateFallbackText(selection);
    }

    // 5. Generate context text (simulated for now)
    const contextText = generateContextText(pageNumber);

    // 6. Save screenshot to server
    let screenshotUrl: string | undefined;
    try {
      console.log("Attempting to save screenshot to server...");
      const selectionId = `${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

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

      if (response.ok) {
        const data = await response.json();
        screenshotUrl = data.data.url;
        console.log("✅ Screenshot saved successfully:", {
          filename: data.data.filename,
          url: screenshotUrl,
          size: data.data.size,
          path: data.data.path,
        });
      } else {
        const errorData = await response.text();
        console.error("❌ Screenshot save failed:", response.status, errorData);
      }
    } catch (error) {
      console.warn("❌ Failed to save screenshot to server:", error);
    }

    return {
      selectedText,
      contextText,
      pageNumber,
      screenshot,
      screenshotUrl,
    };
  } catch (error) {
    console.error("Full page screenshot capture failed:", error);
    throw error;
  }
}

/**
 * Crop the selected area from the full page canvas
 */
function cropCanvasArea(
  sourceCanvas: HTMLCanvasElement,
  selection: ScreenshotSelection
): HTMLCanvasElement {
  const croppedCanvas = document.createElement("canvas");
  const ctx = croppedCanvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  // Set the cropped canvas size
  croppedCanvas.width = selection.width;
  croppedCanvas.height = selection.height;

  // Draw the selected area from the source canvas
  ctx.drawImage(
    sourceCanvas,
    selection.x, // Source x
    selection.y, // Source y
    selection.width, // Source width
    selection.height, // Source height
    0, // Destination x
    0, // Destination y
    selection.width, // Destination width
    selection.height // Destination height
  );

  return croppedCanvas;
}

/**
 * Extract text from screenshot using OCR
 */
async function extractTextFromScreenshot(screenshot: string): Promise<string> {
  try {
    // Try server-side OCR first
    console.log("Attempting server-side OCR...");
    const response = await fetch("/api/ocr-extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: screenshot }),
    });

    if (response.ok) {
      const result = await response.json();
      const extractedText = result.extractedText || "";
      console.log(
        "Server-side OCR successful:",
        extractedText.length,
        "characters"
      );
      return extractedText;
    } else {
      throw new Error(`Server OCR failed: ${response.status}`);
    }
  } catch (serverError) {
    console.warn("Server-side OCR failed, trying client-side:", serverError);

    // Fallback to client-side OCR
    try {
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

      console.log("Client-side OCR completed:", text.length, "characters");
      return text.trim();
    } catch (clientError) {
      console.error("Client-side OCR also failed:", clientError);
      throw clientError;
    }
  }
}

/**
 * Generate fallback text when OCR fails
 */
function generateFallbackText(selection: ScreenshotSelection): string {
  return `I can see you've selected an area of the page (${selection.width} × ${selection.height} pixels), but I'm having trouble automatically extracting the text from this screenshot.

This could be because:
• The selected area contains mostly images or graphics
• The text is too small or unclear for OCR
• The content has complex formatting

Could you help me by:
1. Describing what you see in the selected area
2. Copying and pasting any text from the selection
3. Asking a specific question about the content

For example:
• "Explain this diagram showing..."
• "What does this formula mean: [paste formula]"
• "Help me understand this chart/graph"

I'm ready to help once I know what content you'd like me to explain!`;
}

/**
 * Generate context text for AI analysis
 */
function generateContextText(pageNumber: number): string {
  return `This screenshot was taken from page ${pageNumber} of the PDF document. The user has selected a specific area of their browser window for analysis.

Context considerations:
• This is a screenshot from the user's current browser tab
• The selection may include PDF content, browser UI, or other page elements
• The user is looking for an explanation of the selected visual content
• Consider both textual and visual elements in your analysis

Please provide a helpful explanation based on what you can determine from the extracted text and the context of this being a PDF reading session.`;
}

/**
 * Enhanced screenshot capture with better error handling
 */
export async function captureFullPageSelectionEnhanced(
  selection: ScreenshotSelection,
  bookId: string,
  pageNumber: number = 1
): Promise<ScreenshotResult> {
  try {
    // Validate selection
    if (selection.width < 10 || selection.height < 10) {
      throw new Error("Selection too small - please select a larger area");
    }

    // Check if selection is within viewport
    if (
      selection.x < 0 ||
      selection.y < 0 ||
      selection.x + selection.width > window.innerWidth ||
      selection.y + selection.height > window.innerHeight
    ) {
      console.warn("Selection extends beyond viewport, adjusting...");

      // Adjust selection to fit within viewport
      const adjustedSelection = {
        x: Math.max(0, selection.x),
        y: Math.max(0, selection.y),
        width: Math.min(
          selection.width,
          window.innerWidth - Math.max(0, selection.x)
        ),
        height: Math.min(
          selection.height,
          window.innerHeight - Math.max(0, selection.y)
        ),
      };

      return captureFullPageSelection(adjustedSelection, bookId, pageNumber);
    }

    return captureFullPageSelection(selection, bookId, pageNumber);
  } catch (error: any) {
    console.error("Enhanced screenshot capture failed:", error);

    // Return a helpful error result instead of throwing
    return {
      selectedText: `Screenshot capture encountered an error: ${error.message}

Please try:
• Selecting a larger area (at least 10×10 pixels)
• Ensuring the selection is within the visible page area
• Refreshing the page if the issue persists

You can also describe what you see in the area you wanted to capture, and I'll do my best to help explain it!`,
      contextText: "Screenshot capture failed - manual description needed",
      pageNumber,
      screenshot: createErrorPlaceholderImage(selection),
      screenshotUrl: undefined,
    };
  }
}

/**
 * Create a placeholder image for error cases
 */
function createErrorPlaceholderImage(selection: ScreenshotSelection): string {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(200, selection.width);
  canvas.height = Math.max(100, selection.height);
  const ctx = canvas.getContext("2d")!;

  // Gray background
  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  // Error text
  ctx.fillStyle = "#6b7280";
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Screenshot Error", canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = "12px Arial";
  ctx.fillText(
    `${selection.width} × ${selection.height}px`,
    canvas.width / 2,
    canvas.height / 2 + 10
  );

  return canvas.toDataURL("image/png");
}
