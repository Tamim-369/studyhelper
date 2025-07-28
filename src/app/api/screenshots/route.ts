import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    console.log("Screenshot API called");
    const body = await request.json();
    const { screenshot, bookId, pageNumber, selectionId } = body;

    console.log("Screenshot data received:", {
      hasScreenshot: !!screenshot,
      screenshotLength: screenshot?.length,
      bookId,
      pageNumber,
      selectionId,
    });

    if (!screenshot || !bookId || !pageNumber) {
      console.log("Missing required fields:", {
        screenshot: !!screenshot,
        bookId,
        pageNumber,
      });
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create screenshots directory if it doesn't exist
    const screenshotsDir = join(process.cwd(), "uploads", "screenshots");
    console.log("Screenshots directory path:", screenshotsDir);

    if (!existsSync(screenshotsDir)) {
      console.log("Creating screenshots directory...");
      await mkdir(screenshotsDir, { recursive: true });
      console.log("Screenshots directory created successfully");
    } else {
      console.log("Screenshots directory already exists");
    }

    // Generate filename with timestamp for uniqueness
    const timestamp = Date.now();
    const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const filename = `${bookId}_page${pageNumber}_${dateStr}_${
      selectionId || timestamp
    }.png`;
    const filepath = join(screenshotsDir, filename);

    console.log("Saving screenshot to:", filepath);

    // Remove data URL prefix (data:image/png;base64,)
    const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    console.log("Screenshot buffer size:", buffer.length, "bytes");

    // Save file
    await writeFile(filepath, buffer);
    console.log("Screenshot saved successfully to:", filename);

    const screenshotUrl = `/api/files/screenshots/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        filename,
        url: screenshotUrl,
        path: filepath,
        size: buffer.length,
        timestamp: new Date().toISOString(),
      },
      message: "Screenshot saved successfully",
    });
  } catch (error) {
    console.error("Error saving screenshot:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save screenshot" },
      { status: 500 }
    );
  }
}
