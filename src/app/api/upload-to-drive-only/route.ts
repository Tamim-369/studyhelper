import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { GoogleDriveService } from "@/lib/googleDrive";
import connectDB from "@/lib/db/connection";
import Book from "@/lib/db/models/Book";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!session.accessToken) {
      return NextResponse.json(
        {
          error:
            "Google Drive access token not available. Please sign in again.",
        },
        { status: 401 }
      );
    }

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

    // Validate file size (Google Drive supports up to 5TB, but let's set a reasonable limit)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB limit
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${maxSize / 1024 / 1024 / 1024}GB limit` },
        { status: 400 }
      );
    }

    const fileSizeMB = file.size / 1024 / 1024;
    console.log(
      `📊 Uploading to Google Drive: ${file.name} (${fileSizeMB.toFixed(2)} MB)`
    );

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to Google Drive
    const googleDriveService = new GoogleDriveService(session.accessToken);
    const uploadResult = await googleDriveService.uploadPDF(
      fileBuffer,
      file.name,
      session.accessToken
    );

    // Connect to database and save book metadata
    await connectDB();

    const book = new Book({
      title: title || file.name.replace(".pdf", ""),
      author: author || "Unknown",
      description: description || "",
      fileName: file.name,
      fileSize: file.size,
      totalPages: 0,
      uploadedBy: session.user.email,
      uploadedAt: new Date(),
      isPublic: false,
      tags: [],
      storageType: "google-drive",
      userId: session.user.email,
      mimeType: file.type,
      googleDriveId: uploadResult.id,
      downloadLink: uploadResult.downloadLink,
      viewLink: uploadResult.viewLink,
      directLink: uploadResult.directLink,
    });

    const savedBook = await book.save();

    console.log("✅ Book saved to database:", savedBook._id);

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully to Google Drive",
      data: {
        bookId: savedBook._id,
        title: savedBook.title,
        author: savedBook.author,
        fileName: savedBook.fileName,
        fileSize: savedBook.fileSize,
        storageType: "google-drive",
        googleDriveId: uploadResult.id,
        viewLink: uploadResult.viewLink,
        uploadedAt: savedBook.uploadedAt,
      },
    });
  } catch (error: any) {
    console.error("❌ Error uploading to Google Drive:", error);

    if (error.name === "GoogleDriveError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to upload file to Google Drive" },
      { status: 500 }
    );
  }
}
