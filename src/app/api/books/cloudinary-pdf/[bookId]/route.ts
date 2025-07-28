import { NextRequest, NextResponse } from "next/server";
import CloudinaryService from "@/lib/cloudinary";
import connectDB from "@/lib/db/connection";
import Book from "@/lib/db/models/Book";
import { BookDocument } from "@/lib/db/models/Book";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try:

    const { bookId } = await params;

    // Connect to database and get book info
    await connectDB();
    const book = await Book.findById(bookId).lean() as BookDocument | null;

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Verify this is a Cloudinary book
    if (book.storageType !== "cloudinary" || !book.cloudinaryId) {
      return NextResponse.json(
        { error: "This book is not stored in Cloudinary" },
        { status: 400 }
      );
    }

    // All books are public, no access control needed

    try {
      // Get secure URL from Cloudinary
      const cloudinaryService = new CloudinaryService();
      const pdfUrl = await cloudinaryService.getPDFUrl(book.cloudinaryId);

      // Fetch the PDF from Cloudinary
      const response = await fetch(pdfUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }

      const pdfBuffer = await response.arrayBuffer();

      // Return the PDF stream
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${book.fileName}"`,
          "Cache-Control": "private, max-age=3600", // Cache for 1 hour
          "Content-Length": pdfBuffer.byteLength.toString(),
        },
      });
    } catch (cloudinaryError: any) {
      console.error("Error downloading from Cloudinary:", cloudinaryError);
      
      // If it's an auth error, return specific message
      if (cloudinaryError.statusCode === 401) {
        return NextResponse.json(
          { error: "Cloudinary access expired. Please try again." },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: "Failed to download file from Cloudinary" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in Cloudinary PDF route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
