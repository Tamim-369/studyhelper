import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Highlight } from "@/lib/db/models";
import { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("bookId");
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build query
    const query: any = {};
    if (bookId) query.bookId = bookId;
    if (userId) query.userId = userId;

    // Execute query
    const skip = (page - 1) * limit;
    const highlights = await Highlight.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("bookId", "title author")
      .lean();

    const total = await Highlight.countDocuments(query);

    const response: ApiResponse = {
      success: true,
      data: {
        highlights,
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
    console.error("Error fetching highlights:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to fetch highlights",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { bookId, userId, pageNumber, selectedText, position, color, note } =
      body;

    // Validate required fields
    if (!bookId || !pageNumber || !selectedText || !position) {
      const response: ApiResponse = {
        success: false,
        error: "Missing required fields",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Create new highlight
    const highlight = new Highlight({
      bookId,
      userId: userId || "anonymous",
      pageNumber,
      selectedText,
      position,
      color: color || "#ffeb3b",
      note,
    });

    await highlight.save();

    // Populate the created highlight
    await highlight.populate("bookId", "title author");

    const response: ApiResponse = {
      success: true,
      data: highlight,
      message: "Highlight created successfully",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating highlight:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to create highlight",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
