import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Book } from "@/lib/db/models";
import { ApiResponse } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    await connectDB();

    const { bookId } = await params;
    const book = await Book.findById(bookId).lean();

    if (!book) {
      const response: ApiResponse = {
        success: false,
        error: "Book not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      data: book,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching book:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to fetch book",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    await connectDB();

    const { bookId } = await params;
    const body = await request.json();
    const { title, author, description, tags, isPublic } = body;

    const book = await Book.findByIdAndUpdate(
      bookId,
      {
        title,
        author,
        description,
        tags,
        isPublic,
      },
      { new: true, runValidators: true }
    );

    if (!book) {
      const response: ApiResponse = {
        success: false,
        error: "Book not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      data: book,
      message: "Book updated successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating book:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to update book",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    await connectDB();

    const { bookId } = await params;
    const book = await Book.findByIdAndDelete(bookId);

    if (!book) {
      const response: ApiResponse = {
        success: false,
        error: "Book not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // TODO: Delete associated file from storage
    // TODO: Delete associated highlights and AI conversations

    const response: ApiResponse = {
      success: true,
      message: "Book deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error deleting book:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to delete book",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
