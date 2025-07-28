import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/db/connection";
import Book from "@/lib/db/models/Book";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      googleDriveId,
      title,
      author,
      description,
      fileName,
      fileSize,
      webViewLink,
      webContentLink,
    } = body;

    // Validate required fields
    if (!googleDriveId || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields: googleDriveId and fileName" },
        { status: 400 }
      );
    }

    // Connect to database and save book metadata
    await connectDB();

    const book = new Book({
      title: title || fileName.replace(".pdf", ""),
      author: author || "Unknown",
      description: description || "",
      fileName,
      fileSize: parseInt(fileSize) || 0,
      totalPages: 0,
      uploadedBy: session.user.email,
      uploadedAt: new Date(),
      isPublic: false,
      tags: [],
      storageType: "google-drive",
      userId: session.user.email,
      mimeType: "application/pdf",
      googleDriveId,
      downloadLink: webContentLink,
      viewLink: webViewLink,
      directLink: `https://drive.google.com/uc?id=${googleDriveId}&export=download`,
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
        storageType: "google-drive",
        googleDriveId: savedBook.googleDriveId,
        viewLink: savedBook.viewLink,
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
