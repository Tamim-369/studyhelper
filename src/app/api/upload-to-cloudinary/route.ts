import { NextRequest, NextResponse } from "next/server";
import CloudinaryService from "@/lib/cloudinary";
import connectDB from "@/lib/db/connection";
import Book from "@/lib/db/models/Book";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const description = formData.get("description") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (1GB limit for Cloudinary)
    const maxSize = 1024 * 1024 * 1024; // 1GB limit
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    console.log(
      `📊 File info: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
    );

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary
    const cloudinaryService = new CloudinaryService();
    const uploadResult = await cloudinaryService.uploadPDF(
      fileBuffer,
      file.name,
      "anonymous" // No user authentication required
    );

    // Connect to database and save book metadata
    await connectDB();

    const book = new Book({
      title: title || file.name.replace(".pdf", ""),
      author: author || "Unknown",
      description: description || "",
      fileName: file.name,
      fileSize: file.size,
      totalPages: 0, // Will be updated when PDF is processed
      uploadedBy: "anonymous",
      uploadedAt: new Date(),
      isPublic: true, // Make all uploads public since no auth
      tags: [],
      cloudinaryId: uploadResult.id,
      cloudinaryUrl: uploadResult.url,
      storageType: "cloudinary",
      userId: "anonymous",
      mimeType: file.type,
    });

    const savedBook = await book.save();

    console.log("✅ Book saved to database:", savedBook._id);

    return NextResponse.json({
      success: true,
      message: "File uploaded to Cloudinary successfully",
      data: {
        bookId: savedBook._id,
        title: savedBook.title,
        author: savedBook.author,
        fileName: savedBook.fileName,
        fileSize: savedBook.fileSize,
        cloudinaryId: uploadResult.id,
        cloudinaryUrl: uploadResult.url,
        uploadedAt: savedBook.uploadedAt,
      },
    });
  } catch (error: any) {
    console.error("❌ Error uploading to Cloudinary:", error);

    if (error.name === "CloudinaryError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
