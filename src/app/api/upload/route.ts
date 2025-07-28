import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import connectDB from "@/lib/db/connection";
import { Book } from "@/lib/db/models";
import {
  validateAndExtractPDFInfo,
  sanitizeFilename,
} from "@/lib/pdf/server-utils";
import { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const description = formData.get("description") as string;
    const tags = formData.get("tags") as string;

    // Validate required fields
    if (!file || !title || !author) {
      const response: ApiResponse = {
        success: false,
        error: "Missing required fields: file, title, and author are required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      const response: ApiResponse = {
        success: false,
        error: "Only PDF files are allowed",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      const response: ApiResponse = {
        success: false,
        error: "File size must be less than 500MB",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate PDF and get page count
    const pdfInfo = await validateAndExtractPDFInfo(file);
    if (!pdfInfo.isValid) {
      const response: ApiResponse = {
        success: false,
        error: pdfInfo.error || "Invalid PDF file",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "uploads", "pdfs");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedTitle = sanitizeFilename(title);
    const fileName = `${timestamp}-${sanitizedTitle}.pdf`;
    const filePath = path.join(uploadDir, fileName);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Parse tags
    const parsedTags = tags
      ? tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : [];

    // Save book to database
    const book = new Book({
      title,
      author,
      description: description || undefined,
      fileName,
      filePath: `/uploads/pdfs/${fileName}`,
      fileSize: file.size,
      totalPages: pdfInfo.totalPages || 0,
      uploadedBy: "Anonymous",
      tags: parsedTags,
      isPublic: true,
    });

    await book.save();

    const response: ApiResponse = {
      success: true,
      data: book,
      message: "PDF uploaded successfully",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to upload PDF. Please try again.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
