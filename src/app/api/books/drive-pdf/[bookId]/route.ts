import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { GoogleDriveService } from "@/lib/googleDrive";
import connectDB from "@/lib/db/connection";
import Book from "@/lib/db/models/Book";
import { BookDocument } from "@/lib/db/models/Book";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { bookId } = await params;

    // Connect to database and get book info
    await connectDB();
    const book = (await Book.findById(bookId).lean()) as BookDocument | null;

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Verify this is a Google Drive book
    if (book.storageType !== "google-drive" || !book.googleDriveId) {
      return NextResponse.json(
        { error: "This book is not stored in Google Drive" },
        { status: 400 }
      );
    }

    // Verify user has access to this book
    if (book.userId !== session.user?.email && !book.isPublic) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    try {
      if (!session.accessToken) {
        return NextResponse.json(
          {
            error:
              "Google Drive access token not available. Please sign in again.",
          },
          { status: 401 }
        );
      }

      // Get PDF from Google Drive
      console.log("📥 Streaming PDF from Google Drive:", book.googleDriveId);

      const googleDriveService = new GoogleDriveService(session.accessToken);
      const pdfData = await googleDriveService.downloadFile(
        book.googleDriveId,
        session.accessToken
      );

      // Convert to Buffer for consistent handling
      const pdfBuffer = Buffer.isBuffer(pdfData)
        ? pdfData
        : Buffer.from(pdfData as ArrayBuffer);

      // Return the PDF stream
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${book.fileName}"`,
          "Cache-Control": "private, max-age=3600", // Cache for 1 hour
          "Content-Length": pdfBuffer.length.toString(),
          "X-Storage-Type": "google-drive", // Debug header
        },
      });
    } catch (driveError: any) {
      console.error("Error downloading from Google Drive:", driveError);

      // If it's an auth error, return specific message
      if (
        driveError.message?.includes("401") ||
        driveError.message?.includes("unauthorized")
      ) {
        return NextResponse.json(
          { error: "Google Drive access expired. Please sign in again." },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: "Failed to download file from Google Drive" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in drive PDF route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
