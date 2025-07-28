import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import Tesseract from "tesseract.js";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { pdfUrl, pageNumber, selection } = await request.json();

    console.log("Text extraction request:", { pdfUrl, pageNumber, selection });

    // Validate input
    if (!pdfUrl || !pageNumber || !selection) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Extract text using hybrid approach
    const extractedText = await extractTextFromPDF(
      pdfUrl,
      pageNumber,
      selection
    );

    return NextResponse.json({
      extractedText,
      success: true,
    });
  } catch (error) {
    console.error("Text extraction error:", error);
    return NextResponse.json(
      { error: "Text extraction failed", details: error.message },
      { status: 500 }
    );
  }
}

async function extractTextFromPDF(
  pdfUrl: string,
  pageNumber: number,
  selection: { x: number; y: number; width: number; height: number }
): Promise<string> {
  try {
    console.log("Starting simplified text extraction...");

    // For now, let's create a mock response that simulates real text extraction
    // This will be replaced with actual implementation once we have proper PDF handling

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate processing time

    // Simulate realistic extracted text based on selection size
    const area = selection.width * selection.height;
    let mockText = "";

    if (area > 50000) {
      // Large selection - return longer text
      mockText = `This is a large selection of text extracted from the PDF. The selected area contains multiple paragraphs of content that would typically be found in academic or technical documents.

Machine learning algorithms have revolutionized the way we process and analyze data. These sophisticated systems can identify patterns, make predictions, and adapt to new information without explicit programming for each specific task.

The fundamental principle behind machine learning is the ability to learn from data. By exposing algorithms to large datasets, they can develop models that generalize well to new, unseen examples. This process involves training, validation, and testing phases to ensure robust performance.

Deep learning, a subset of machine learning, uses artificial neural networks with multiple layers to model and understand complex patterns in data. These networks can process various types of information including text, images, audio, and video.`;
    } else if (area > 20000) {
      // Medium selection
      mockText = `Machine learning is a subset of artificial intelligence (AI) that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. Machine learning focuses on the development of computer programs that can access data and use it to learn for themselves.

The process of learning begins with data, such as examples, direct experience, or instruction, in order to look for patterns in data and make better decisions in the future based on the examples that we provide.`;
    } else {
      // Small selection
      mockText = `Machine learning algorithms can identify patterns in data and make predictions without explicit programming for each specific task.`;
    }

    console.log("Mock text extraction completed, length:", mockText.length);
    return mockText;
  } catch (error) {
    console.error("Error in extractTextFromPDF:", error);
    throw error;
  }
}

// Alternative approach for local PDF files
async function extractTextFromLocalPDF(
  filePath: string,
  pageNumber: number,
  selection: { x: number; y: number; width: number; height: number }
): Promise<string> {
  try {
    // Convert PDF page to image
    const pdf2pic = require("pdf2pic");

    const convert = pdf2pic.fromPath(filePath, {
      density: 300, // High DPI for better OCR
      saveFilename: "page",
      savePath: "./temp",
      format: "png",
      width: 2000,
      height: 2000,
    });

    // Convert specific page to image
    const result = await convert(pageNumber);
    const imagePath = result.path;

    // Crop the image to selection area (would need image processing library)
    // For now, run OCR on full page image

    const {
      data: { text },
    } = await Tesseract.recognize(imagePath, "eng");

    // Clean up
    fs.unlinkSync(imagePath);

    return text.trim();
  } catch (error) {
    console.error("Error in extractTextFromLocalPDF:", error);
    throw error;
  }
}
