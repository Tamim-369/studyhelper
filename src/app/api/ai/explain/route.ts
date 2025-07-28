import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import { Book, Highlight, AIExplanation } from "@/lib/db/models";
import { groqAI } from "@/lib/ai/groq";
import { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { highlightId, bookId, userId, highlightedText, contextText } = body;

    // Validate required fields
    if (!highlightId || !bookId || !highlightedText || !contextText) {
      const response: ApiResponse = {
        success: false,
        error: "Missing required fields",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get book information
    const book = await Book.findById(bookId);
    if (!book) {
      const response: ApiResponse = {
        success: false,
        error: "Book not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Verify highlight exists
    const highlight = await Highlight.findById(highlightId);
    if (!highlight) {
      const response: ApiResponse = {
        success: false,
        error: "Highlight not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check if explanation already exists
    const existingExplanation = await AIExplanation.findOne({ highlightId });
    if (existingExplanation) {
      const response: ApiResponse = {
        success: true,
        data: existingExplanation,
      };
      return NextResponse.json(response);
    }

    // Generate AI explanation
    const explanation = await groqAI.generateExplanation(
      highlightedText,
      contextText,
      book.title,
      book.author
    );

    // Save explanation to database
    const aiExplanation = new AIExplanation({
      highlightId,
      userId: userId || "anonymous",
      bookId,
      contextText,
      explanation,
    });

    await aiExplanation.save();

    const response: ApiResponse = {
      success: true,
      data: aiExplanation,
      message: "Explanation generated successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating explanation:", error);
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate explanation",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
