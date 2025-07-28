"use client";

export interface SimpleSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SimpleScreenshotResult {
  selectedText: string;
  contextText: string;
  pageNumber: number;
  screenshot: string;
  screenshotUrl?: string;
}

/**
 * Simple, reliable screenshot capture using html2canvas
 */
export async function captureSimpleScreenshot(
  selection: SimpleSelection,
  bookId: string,
  pageNumber: number = 1
): Promise<SimpleScreenshotResult> {
  try {
    console.log("🚀 Starting simple screenshot capture...");

    // Import html2canvas dynamically
    const html2canvas = await import("html2canvas");
    console.log("✅ html2canvas imported");

    // Try PDF canvas direct capture first (avoids CSS issues completely)
    const pdfCanvas = document.querySelector("canvas") as HTMLCanvasElement;
    let fullPageCanvas: HTMLCanvasElement;

    if (pdfCanvas && pdfCanvas.width > 0 && pdfCanvas.height > 0) {
      console.log("📸 Using PDF canvas direct capture (no CSS parsing)...");

      fullPageCanvas = document.createElement("canvas");
      const ctx = fullPageCanvas.getContext("2d")!;

      // Set canvas size to match viewport
      fullPageCanvas.width = window.innerWidth;
      fullPageCanvas.height = window.innerHeight;

      // Light background
      ctx.fillStyle = "#f8f9fa";
      ctx.fillRect(0, 0, fullPageCanvas.width, fullPageCanvas.height);

      // Get PDF canvas position and draw it
      const pdfRect = pdfCanvas.getBoundingClientRect();
      ctx.drawImage(
        pdfCanvas,
        pdfRect.left,
        pdfRect.top,
        pdfRect.width,
        pdfRect.height
      );

      console.log("✅ PDF canvas captured directly (no CSS issues)");
    } else {
      console.log(
        "📸 No PDF canvas found, trying html2canvas with CSS fixes..."
      );

      // Fallback: html2canvas with aggressive CSS filtering
      fullPageCanvas = await html2canvas.default(document.body, {
        useCORS: false,
        allowTaint: false,
        scale: 0.8,
        logging: false,
        backgroundColor: "#ffffff",
        removeContainer: true,
        // Aggressively ignore problematic elements
        ignoreElements: (element) => {
          const tagName = element.tagName?.toLowerCase();
          const className = element.className?.toString() || "";

          // Skip all potentially problematic elements
          if (tagName === "script" || tagName === "style" || tagName === "link")
            return true;
          if (className.includes("gradient")) return true;
          if (className.includes("shadow")) return true;
          if (className.includes("backdrop")) return true;
          if (element.hasAttribute("data-html2canvas-ignore")) return true;

          return false;
        },
        onclone: (clonedDoc) => {
          // Remove all stylesheets that might contain lab() functions
          const styles = clonedDoc.querySelectorAll(
            'style, link[rel="stylesheet"]'
          );
          styles.forEach((style) => {
            if (
              style.textContent?.includes("lab(") ||
              style.getAttribute("href")?.includes("tailwind")
            ) {
              style.remove();
            }
          });

          // Remove any elements with problematic inline styles
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            const style = el.getAttribute("style");
            if (style?.includes("lab(")) {
              el.removeAttribute("style");
            }
          });
        },
      });
    }

    console.log("✅ Page captured successfully:", {
      width: fullPageCanvas.width,
      height: fullPageCanvas.height,
    });

    // Crop the selected area
    const croppedCanvas = cropArea(fullPageCanvas, selection);
    const screenshot = croppedCanvas.toDataURL("image/png");

    console.log("✅ Area cropped:", {
      width: croppedCanvas.width,
      height: croppedCanvas.height,
      screenshotSize: screenshot.length,
    });

    // Extract text using AI
    let selectedText = "";
    try {
      selectedText = await extractTextWithAI(screenshot);
      console.log("✅ AI text extraction successful");
    } catch (aiError) {
      console.warn("⚠️ AI extraction failed:", aiError);
      selectedText = `I can see you've selected an area (${selection.width}×${selection.height}px), but I'm having trouble extracting the text automatically.

Please describe what you see in the selected area, and I'll help explain it!

For example:
• "Explain this paragraph about..."
• "What does this formula mean: [describe the formula]"
• "Help me understand this diagram"`;
    }

    // Generate context
    const contextText = `This screenshot was taken from page ${pageNumber} of the PDF document. The user selected an area of ${selection.width}×${selection.height} pixels for analysis.`;

    // Save screenshot to server
    let screenshotUrl: string | undefined;
    try {
      const response = await fetch("/api/screenshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenshot,
          bookId,
          pageNumber,
          selectionId: `simple_${Date.now()}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        screenshotUrl = data.data.url;
        console.log("✅ Screenshot saved to server");
      }
    } catch (saveError) {
      console.warn("⚠️ Failed to save screenshot:", saveError);
    }

    return {
      selectedText,
      contextText,
      pageNumber,
      screenshot,
      screenshotUrl,
    };
  } catch (error: any) {
    console.error("❌ Simple screenshot capture failed:", error);

    // Create a fallback result
    return {
      selectedText: `Screenshot capture encountered an issue: ${error.message}

I can still help you! Please:
1. **Describe what you see** in the selected area
2. **Copy-paste any text** if you can read it
3. **Ask specific questions** about the content

For example:
• "Explain this concept: [describe it]"
• "What does this mean: [paste text]"
• "Help me understand: [your question]"

I'm ready to help once I know what you're looking at!`,
      contextText: "Screenshot capture failed - manual description needed",
      pageNumber,
      screenshot: createErrorPlaceholder(selection),
      screenshotUrl: undefined,
    };
  }
}

/**
 * Crop the selected area from the full page canvas
 */
function cropArea(
  sourceCanvas: HTMLCanvasElement,
  selection: SimpleSelection
): HTMLCanvasElement {
  const croppedCanvas = document.createElement("canvas");
  const ctx = croppedCanvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  croppedCanvas.width = selection.width;
  croppedCanvas.height = selection.height;

  // Draw the selected area from source canvas
  ctx.drawImage(
    sourceCanvas,
    selection.x,
    selection.y,
    selection.width,
    selection.height,
    0,
    0,
    selection.width,
    selection.height
  );

  return croppedCanvas;
}

/**
 * Extract text using AI vision
 */
async function extractTextWithAI(screenshot: string): Promise<string> {
  const response = await fetch("/api/ocr-extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: screenshot }),
  });

  if (!response.ok) {
    throw new Error(`AI extraction failed: ${response.status}`);
  }

  const result = await response.json();
  return result.extractedText || "";
}

/**
 * Create error placeholder image
 */
function createErrorPlaceholder(selection: SimpleSelection): string {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(300, selection.width);
  canvas.height = Math.max(150, selection.height);
  const ctx = canvas.getContext("2d")!;

  // Light gray background
  ctx.fillStyle = "#f8f9fa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = "#dee2e6";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  // Error text
  ctx.fillStyle = "#6c757d";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Screenshot Error", canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = "12px Arial";
  ctx.fillText(
    "Please describe what you see",
    canvas.width / 2,
    canvas.height / 2 + 15
  );

  return canvas.toDataURL("image/png");
}
