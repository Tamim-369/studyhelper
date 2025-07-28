// Server-side PDF utilities - simple validation without external dependencies

export interface PDFInfo {
  isValid: boolean;
  totalPages?: number;
  text?: string;
  error?: string;
}

/**
 * Server-side PDF validation (basic validation only)
 */
export async function validateAndExtractPDFInfo(file: File): Promise<PDFInfo> {
  try {
    // Basic file validation
    if (file.type !== "application/pdf") {
      return {
        isValid: false,
        error: "File must be a PDF",
      };
    }

    if (file.size === 0) {
      return {
        isValid: false,
        error: "File is empty",
      };
    }

    // Check if file starts with PDF header
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const header = String.fromCharCode(...uint8Array.slice(0, 4));

    if (header !== "%PDF") {
      return {
        isValid: false,
        error: "Invalid PDF file format",
      };
    }

    // For now, return a default page count
    // The actual page count will be determined when the PDF is loaded in the viewer
    return {
      isValid: true,
      totalPages: 1, // Default - will be updated by client-side PDF.js
    };
  } catch (error) {
    console.error("PDF validation error:", error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Invalid PDF file",
    };
  }
}

/**
 * Extract text from specific pages (server-side)
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  // Text extraction is better handled client-side with PDF.js
  // This is a placeholder for server-side text extraction if needed
  console.log("Text extraction should be done client-side with PDF.js");
  return "";
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}
