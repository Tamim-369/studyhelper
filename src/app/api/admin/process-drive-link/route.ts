import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/db/connection";
import Book from "@/lib/db/models/Book";
import { authOptions } from "@/lib/auth";

// Admin access - now open to everyone
// const ADMIN_EMAIL = 'ashiqurrahmantamim369@gmail.com';

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

// Get basic file info without authentication (for public files)
async function getPublicFileInfo(fileId: string) {
  try {
    // Try to get basic file info from Google Drive API without auth
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,size,mimeType&key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get file info: ${response.status}`);
    }

    const fileData = await response.json();
    return fileData;
  } catch (error) {
    console.error("Error getting public file info:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Admin access now open to everyone
    // if (session.user.email !== ADMIN_EMAIL) {
    //   return NextResponse.json(
    //     { error: "Access denied. Admin privileges required." },
    //     { status: 403 }
    //   );
    // }

    const body = await request.json();
    const { driveUrl, title, author, description } = body;

    if (!driveUrl || !title || !author) {
      return NextResponse.json(
        { error: "Google Drive URL, title, and author are required" },
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

    console.log(`🔗 Admin processing Google Drive link: ${driveUrl}`);
    console.log(`📁 Extracted file ID: ${fileId}`);

    try {
      // Get file info (works for public files)
      const fileInfo = await getPublicFileInfo(fileId);

      // Validate that it's a PDF file
      if (fileInfo.mimeType !== "application/pdf") {
        return NextResponse.json(
          { error: `File is not a PDF. Found: ${fileInfo.mimeType}` },
          { status: 400 }
        );
      }

      console.log(
        `✅ File validated: ${fileInfo.name} (${fileInfo.size} bytes)`
      );

      // Check if this file is already in our database
      await connectDB();
      const existingBook = await Book.findOne({
        googleDriveId: fileId,
      });

      if (existingBook) {
        return NextResponse.json({
          success: true,
          message: "Book already exists in library",
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

      // Create public links
      const viewLink = `https://drive.google.com/file/d/${fileId}/view`;
      const downloadLink = `https://drive.google.com/uc?id=${fileId}&export=download`;

      // Save new book metadata to database (public book)
      const book = new Book({
        title: title.trim(),
        author: author.trim(),
        description: description?.trim() || "",
        fileName: fileInfo.name,
        fileSize: parseInt(fileInfo.size) || 0,
        totalPages: 0,
        uploadedBy: session.user.email,
        uploadedAt: new Date(),
        isPublic: true, // Make it public so all users can access
        tags: [],
        storageType: "google-drive",
        userId: "public", // Mark as public book
        mimeType: fileInfo.mimeType,
        googleDriveId: fileId,
        downloadLink: downloadLink,
        viewLink: viewLink,
        directLink: downloadLink,
      });

      const savedBook = await book.save();

      console.log("✅ Public book saved to database:", savedBook._id);

      return NextResponse.json({
        success: true,
        message: "Book added to public library successfully",
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
    } catch (fileError: any) {
      console.error("❌ Error accessing Google Drive file:", fileError);

      return NextResponse.json(
        {
          error:
            "Failed to access Google Drive file. Please ensure the file is publicly accessible or the link is correct.",
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
