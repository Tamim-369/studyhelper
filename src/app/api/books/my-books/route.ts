import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/db/connection";
import Book from "@/lib/db/models/Book";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const storageType = searchParams.get("storageType") || ""; // Filter by storage type

    // Build query for user's books
    const query: any = {
      userId: session.user.email,
    };

    // Add storage type filter if specified
    if (storageType && ["cloudinary", "google-drive"].includes(storageType)) {
      query.storageType = storageType;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { fileName: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const books = await Book.find(query)
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Book.countDocuments(query);

    // Add storage type counts for UI
    const storageCounts = await Book.aggregate([
      { $match: { userId: session.user.email } },
      { $group: { _id: "$storageType", count: { $sum: 1 } } }
    ]);

    const counts = storageCounts.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        books,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        storageCounts: {
          total,
          cloudinary: counts.cloudinary || 0,
          "google-drive": counts["google-drive"] || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user's books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}
