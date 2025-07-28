import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { GoogleDriveService } from "@/lib/googleDrive";
import CloudinaryService from "@/lib/cloudinary";
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

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { bookId } = await params;

    // Connect to database and get book info
    await connectDB();
    const book = await Book.findById(bookId).lean() as BookDocument | null;

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Verify user has access to this book
    if (book.userId !== session.user?.email && !book.isPublic) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    try {
      let pdfBuffer: ArrayBuffer;

      if (book.storageType === "google-drive") {
        console.log("📥 Streaming PDF from Google Drive:", book.googleDriveId);
        
        if (!session.accessToken) {
          return NextResponse.json(
            { error: "Google Drive access token not available. Please sign in again." },
            { status: 401 }
          );
        }

        const googleDriveService = new GoogleDriveService();
        pdfBuffer = await googleDriveService.downloadFile(
          book.googleDriveId!,
          session.accessToken
        );
      } else if (book.storageType === "cloudinary") {
        console.log("📥 Streaming PDF from Cloudinary:", book.cloudinaryId);
        
        const cloudinaryService = new CloudinaryService();
        const pdfUrl = await cloudinaryService.getPDFUrl(book.cloudinaryId!);
        
        // Fetch the PDF from Cloudinary
        const response = await fetch(pdfUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }

        pdfBuffer = await response.arrayBuffer();
      } else {
        return NextResponse.json(
          { error: "Unsupported storage type" },
          { status: 400 }
        );
      }

      // Return the PDF stream
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${book.fileName}"`,
          "Cache-Control": "private, max-age=3600", // Cache for 1 hour
          "Content-Length": pdfBuffer.byteLength.toString(),
          "X-Storage-Type": book.storageType, // Debug header
        },
      });
    } catch (storageError: any) {
      console.error(`Error downloading from ${book.storageType}:`, storageError);
      
      // If it's an auth error, return specific message
      if (storageError.statusCode === 401) {
        return NextResponse.json(
          { error: `${book.storageType} access expired. Please sign in again.` },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: `Failed to download file from ${book.storageType}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in PDF stream route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
