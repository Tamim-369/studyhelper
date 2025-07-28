import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Book } from "@/lib/db/models";
import { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";
    const sortBy = searchParams.get("sortBy") || "uploadedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query
    const query: any = { isPublic: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (tag) {
      query.tags = tag;
    }

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const skip = (page - 1) * limit;
    const books = await Book.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Book.countDocuments(query);

    const response: ApiResponse = {
      success: true,
      data: {
        books,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching books:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to fetch books",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      title,
      author,
      description,
      fileName,
      filePath,
      fileSize,
      totalPages,
      uploadedBy,
      tags,
      thumbnail,
    } = body;

    // Validate required fields
    if (
      !title ||
      !author ||
      !fileName ||
      !filePath ||
      !fileSize ||
      !totalPages
    ) {
      const response: ApiResponse = {
        success: false,
        error: "Missing required fields",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Create new book
    const book = new Book({
      title,
      author,
      description,
      fileName,
      filePath,
      fileSize,
      totalPages,
      uploadedBy: uploadedBy || "Anonymous",
      tags: tags || [],
      thumbnail,
      isPublic: true,
    });

    await book.save();

    const response: ApiResponse = {
      success: true,
      data: book,
      message: "Book uploaded successfully",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating book:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to create book",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
