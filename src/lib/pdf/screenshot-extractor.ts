"use client";

export interface ScreenshotSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScreenshotContent {
  selectedText: string;
  contextText: string;
  pageNumber: number;
  screenshot: string; // base64 image
  screenshotUrl?: string;
}

/**
 * Capture screenshot of selected area using modern browser APIs
 */
export async function captureScreenshotSelection(
  selection: ScreenshotSelection,
  pageNumber: number,
  bookId: string
): Promise<ScreenshotContent> {
  try {
    console.log("Starting screenshot capture:", {
      selection,
      pageNumber,
      bookId,
    });

    // 1. Capture the selected area using html2canvas
    const screenshot = await captureSelectedArea(selection);
    console.log("Screenshot captured, length:", screenshot.length);

    // 2. Extract text from the screenshot using OCR
    let selectedText = await extractTextFromScreenshot(screenshot);
    console.log(
      "Text extracted from screenshot:",
      selectedText.substring(0, 100) + "..."
    );

    // If screenshot capture failed, provide a helpful message
    if (
      selectedText.includes("[Text extraction failed") ||
      screenshot.includes("Screenshot Not Available")
    ) {
      selectedText = `I can see you've selected an area of the PDF, but I cannot capture screenshots of PDF content due to browser security restrictions.

**Please help me by:**
1. Looking at the content in the area you selected
2. Typing or copy-pasting that text in our chat
3. Then I can explain it to you!

**For example, you could type:**
- "Explain this formula: E = mc²"
- "What does this paragraph mean: [paste the text here]"
- "Help me understand this concept: [describe what you see]"

I'm ready to help explain any content from your PDF once you share the text with me! 📚✨`;
    }

    // 3. Generate context (since we don't have PDF structure, we'll use the extracted text as context)
    const contextText = generateContextFromText(selectedText, pageNumber);

    // 4. Save screenshot to server
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
      console.warn("Failed to save screenshot to server:", error);
    }

    return {
      selectedText,
      contextText,
      pageNumber,
      screenshot,
      screenshotUrl,
    };
  } catch (error) {
    console.error("Error in screenshot capture:", error);
    throw error;
  }
}

/**
 * Capture the selected area from the screen using html2canvas
 */
async function captureSelectedArea(
  selection: ScreenshotSelection
): Promise<string> {
  console.log("Attempting to capture screenshot...", selection);

  try {
    // Import html2canvas dynamically
    const html2canvas = await import("html2canvas");

    // Strategy 1: Try to capture the specific iframe content
    const iframe = document.querySelector("iframe") as HTMLIFrameElement;
    if (iframe) {
      console.log("Found iframe, attempting to capture iframe content...");

      try {
        // Try to capture the iframe directly
        const canvas = await html2canvas.default(iframe, {
          useCORS: true,
          allowTaint: true,
          scale: 1,
          logging: true,
          backgroundColor: "#ffffff",
          foreignObjectRendering: false,
          x: selection.x,
          y: selection.y,
          width: selection.width,
          height: selection.height,
        });

        console.log("Iframe capture successful!");
        return canvas.toDataURL("image/png");
      } catch (iframeError) {
        console.warn("Iframe capture failed:", iframeError);
      }
    }

    // Strategy 2: Capture the entire document and crop
    console.log("Trying full document capture...");
    const fullCanvas = await html2canvas.default(document.documentElement, {
      useCORS: true,
      allowTaint: true,
      scale: 1,
      logging: true,
      backgroundColor: "#ffffff",
      foreignObjectRendering: false,
      imageTimeout: 10000,
    });

    // Crop to selection area
    const croppedCanvas = document.createElement("canvas");
    const ctx = croppedCanvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    croppedCanvas.width = selection.width;
    croppedCanvas.height = selection.height;

    ctx.drawImage(
      fullCanvas,
      selection.x,
      selection.y,
      selection.width,
      selection.height,
      0,
      0,
      selection.width,
      selection.height
    );

    console.log("Document capture and crop successful!");
    return croppedCanvas.toDataURL("image/png");
  } catch (error) {
    console.error("All screenshot methods failed:", error);

    // Create a helpful error message for the user
    return createHelpfulErrorImage(selection, error);
  }
}

/**
 * Create a helpful error image that suggests manual text input
 */
function createHelpfulErrorImage(
  selection: ScreenshotSelection,
  error: any
): string {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(500, selection.width);
  canvas.height = Math.max(400, selection.height);
  const ctx = canvas.getContext("2d")!;

  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#f8fafc");
  gradient.addColorStop(1, "#e2e8f0");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = "#1e40af";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Screenshot Not Available", canvas.width / 2, 50);

  // Explanation
  ctx.fillStyle = "#475569";
  ctx.font = "16px Arial";
  ctx.fillText(
    "PDF content cannot be captured due to browser security.",
    canvas.width / 2,
    90
  );

  // Solution
  ctx.fillStyle = "#059669";
  ctx.font = "bold 18px Arial";
  ctx.fillText(
    "💡 Solution: Type or paste the text below",
    canvas.width / 2,
    140
  );

  // Instructions
  ctx.fillStyle = "#374151";
  ctx.font = "14px Arial";
  ctx.fillText(
    "1. Look at the PDF content in the selected area",
    canvas.width / 2,
    180
  );
  ctx.fillText(
    "2. Type or copy-paste that text in the chat",
    canvas.width / 2,
    200
  );
  ctx.fillText(
    "3. Ask your question about that content",
    canvas.width / 2,
    220
  );

  // Example
  ctx.fillStyle = "#6b7280";
  ctx.font = "italic 12px Arial";
  ctx.fillText(
    'Example: "Explain this formula: E = mc²"',
    canvas.width / 2,
    260
  );

  // Selection info
  ctx.fillStyle = "#9ca3af";
  ctx.font = "10px Arial";
  ctx.fillText(
    `Selected area: ${selection.width} × ${selection.height} pixels`,
    canvas.width / 2,
    canvas.height - 20
  );

  return canvas.toDataURL("image/png");
}

/**
 * Extract text from screenshot using OCR
 */
async function extractTextFromScreenshot(screenshot: string): Promise<string> {
  try {
    console.log("Starting OCR extraction...");

    // Try server-side OCR first (more reliable)
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
    return "[Text extraction failed. Please try selecting a clearer area with more readable text.]";
  }
}

/**
 * Generate context text from the extracted text
 */
function generateContextFromText(
  extractedText: string,
  pageNumber: number
): string {
  // Since we don't have access to the full PDF structure, we'll create context
  // based on the extracted text and provide helpful information for the AI

  const wordCount = extractedText.split(" ").length;
  const hasNumbers = /\d/.test(extractedText);
  const hasFormulas = /[=+\-*/()^]/.test(extractedText);
  const hasSpecialChars = /[αβγδεζηθικλμνξοπρστυφχψω∑∫∂∇]/.test(extractedText);

  let context = `[Screenshot from page ${pageNumber}]\n\n`;
  context += `Selected text contains approximately ${wordCount} words.\n\n`;

  if (hasNumbers) context += "The selection contains numerical data.\n";
  if (hasFormulas)
    context +=
      "The selection appears to contain mathematical expressions or formulas.\n";
  if (hasSpecialChars)
    context += "The selection contains special characters or symbols.\n";

  context += `\nFull extracted text:\n"${extractedText}"\n\n`;
  context += `This content was selected by the user from a PDF document for explanation. Please provide a clear, educational explanation of this content.`;

  return context;
}

/**
 * Create a placeholder screenshot when capture fails
 */
function createPlaceholderScreenshot(selection: ScreenshotSelection): string {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(400, selection.width);
  canvas.height = Math.max(200, selection.height);
  const ctx = canvas.getContext("2d")!;

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  // Error message
  ctx.fillStyle = "#6b7280";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    "Screenshot capture failed",
    canvas.width / 2,
    canvas.height / 2 - 20
  );
  ctx.fillText(
    "Please try selecting again",
    canvas.width / 2,
    canvas.height / 2 + 20
  );

  return canvas.toDataURL("image/png");
}
