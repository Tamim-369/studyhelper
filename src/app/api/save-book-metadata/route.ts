import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Book from "@/lib/db/models/Book";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      author,
      description,
      fileName,
      fileSize,
      cloudinaryId,
      cloudinaryUrl,
    } = body;

    // Connect to database and save book metadata
    await connectDB();

    const book = new Book({
      title: title || fileName.replace(".pdf", ""),
      author: author || "Unknown",
      description: description || "",
      fileName,
      fileSize,
      totalPages: 0, // Will be updated when PDF is processed
      uploadedBy: "anonymous",
      uploadedAt: new Date(),
      isPublic: true, // Make all uploads public since no auth
      tags: [],
      cloudinaryId,
      cloudinaryUrl,
      storageType: "cloudinary",
      userId: "anonymous",
      mimeType: "application/pdf",
    });

    const savedBook = await book.save();

    console.log("✅ Book metadata saved to database:", savedBook._id);

    return NextResponse.json({
      success: true,
      message: "Book metadata saved successfully",
      data: {
        bookId: savedBook._id,
        title: savedBook.title,
        author: savedBook.author,
        fileName: savedBook.fileName,
        fileSize: savedBook.fileSize,
        cloudinaryId,
        cloudinaryUrl,
        uploadedAt: savedBook.uploadedAt,
      },
    });
  } catch (error: any) {
    console.error("❌ Error saving book metadata:", error);
    return NextResponse.json(
      { error: "Failed to save book metadata" },
      { status: 500 }
    );
  }
}
