import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { GoogleDriveService } from "@/lib/googleDrive";
import connectDB from "@/lib/db/connection";
import Book from "@/lib/db/models/Book";
import { authOptions } from "@/lib/auth";

// Extract Google Drive file ID from various URL formats
function extractGoogleDriveFileId(url: string): string | null {
  const patterns = [
    // https://drive.google.com/file/d/FILE_ID/view
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    // https://drive.google.com/open?id=FILE_ID
    /[?&]id=([a-zA-Z0-9-_]+)/,
    // https://drive.google.com/uc?id=FILE_ID
    /[?&]id=([a-zA-Z0-9-_]+)/,
    // Direct file ID (if user just pastes the ID)
    /^([a-zA-Z0-9-_]{25,})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

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

    const body = await request.json();
    const { driveUrl, title, author, description } = body;

    if (!driveUrl) {
      return NextResponse.json(
        { error: "Google Drive URL is required" },
        { status: 400 }
      );
    }

    // Extract file ID from the URL
    const fileId = extractGoogleDriveFileId(driveUrl);
    if (!fileId) {
      return NextResponse.json(
        {
          error:
            "Invalid Google Drive URL. Please provide a valid Google Drive file link.",
        },
        { status: 400 }
      );
    }

    console.log(`🔗 Processing Google Drive link: ${driveUrl}`);
    console.log(`📁 Extracted file ID: ${fileId}`);

    // Get file metadata from Google Drive
    const googleDriveService = new GoogleDriveService(session.accessToken);

    try {
      const fileMetadata = await googleDriveService.getFileMetadata(fileId);

      // Validate that it's a PDF file
      if (fileMetadata.mimeType !== "application/pdf") {
        return NextResponse.json(
          { error: `File is not a PDF. Found: ${fileMetadata.mimeType}` },
          { status: 400 }
        );
      }

      console.log(
        `✅ File validated: ${fileMetadata.name} (${fileMetadata.size} bytes)`
      );

      // Check if this file is already in our database
      await connectDB();
      const existingBook = await Book.findOne({
        googleDriveId: fileId,
        userId: session.user.email,
      });

      if (existingBook) {
        return NextResponse.json({
          success: true,
          message: "File already exists in your library",
          data: {
            bookId: existingBook._id,
            title: existingBook.title,
            author: existingBook.author,
            fileName: existingBook.fileName,
            fileSize: existingBook.fileSize,
            storageType: "google-drive",
            googleDriveId: existingBook.googleDriveId,
            viewLink: existingBook.viewLink,
            uploadedAt: existingBook.uploadedAt,
            isExisting: true,
          },
        });
      }

      // Save new book metadata to database
      const book = new Book({
        title: title || (fileMetadata.name || "Unknown").replace(".pdf", ""),
        author: author || "Unknown",
        description: description || "",
        fileName: fileMetadata.name || "unknown.pdf",
        fileSize: parseInt(fileMetadata.size || "0") || 0,
        totalPages: 0,
        uploadedBy: session.user.email,
        uploadedAt: new Date(),
        isPublic: false,
        tags: [],
        storageType: "google-drive",
        userId: session.user.email,
        mimeType: fileMetadata.mimeType,
        googleDriveId: fileId,
        downloadLink: fileMetadata.webContentLink,
        viewLink: fileMetadata.webViewLink,
        directLink: `https://drive.google.com/uc?id=${fileId}&export=download`,
      });

      const savedBook = await book.save();

      console.log("✅ Book metadata saved to database:", savedBook._id);

      return NextResponse.json({
        success: true,
        message: "Google Drive file processed successfully",
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
          isExisting: false,
        },
      });
    } catch (driveError: any) {
      console.error("❌ Error accessing Google Drive file:", driveError);

      if (driveError.statusCode === 404) {
        return NextResponse.json(
          {
            error:
              "File not found. Please check the URL and ensure you have access to the file.",
          },
          { status: 404 }
        );
      }

      if (driveError.statusCode === 403) {
        return NextResponse.json(
          {
            error:
              "Access denied. Please ensure the file is shared with you or is publicly accessible.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error:
            "Failed to access Google Drive file. Please check the URL and your permissions.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Error processing Google Drive link:", error);
    return NextResponse.json(
      { error: "Failed to process Google Drive link" },
      { status: 500 }
    );
  }
}
