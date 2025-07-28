import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { GoogleDriveService } from "@/lib/googleDrive";
import connectDB from "@/lib/db/connection";
import Book from "@/lib/db/models/Book";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

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

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 500MB." },
        { status: 400 }
      );
    }

    console.log("📁 Processing file:", file.name, "Size:", file.size);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Google Drive
    const driveService = new GoogleDriveService(session.accessToken as string);
    const uploadResult = await driveService.uploadFile(
      buffer,
      file.name,
      file.type
    );

    // Connect to database and save book metadata
    await connectDB();

    const bookData = {
      title: file.name.replace(".pdf", ""),
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      googleDriveId: uploadResult.id,
      downloadLink: uploadResult.downloadLink,
      viewLink: uploadResult.viewLink,
      directLink: uploadResult.directLink,
      uploadedAt: new Date(),
      userId: session.user?.email,
      storageType: "google-drive",
    };

    // Save to database
    const savedBook = await Book.create(bookData);

    console.log("✅ Upload completed successfully");

    return NextResponse.json({
      success: true,
      book: {
        _id: savedBook._id,
        title: savedBook.title,
        fileName: savedBook.fileName,
        fileSize: savedBook.fileSize,
        downloadLink: savedBook.downloadLink,
        viewLink: savedBook.viewLink,
        directLink: savedBook.directLink,
        uploadedAt: savedBook.uploadedAt,
        storageType: savedBook.storageType,
      },
      message: "File uploaded successfully to Google Drive",
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
