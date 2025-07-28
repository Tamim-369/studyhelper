import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import connectDB from "@/lib/db/connection";
import { AIExplanation } from "@/lib/db/models";

export async function POST(request: NextRequest) {
  try {
    const { screenshotUrl, explanationId } = await request.json();

    console.log("🧹 Cleanup requested:", { screenshotUrl, explanationId });

    let cleanupResults = {
      screenshotDeleted: false,
      explanationDeleted: false,
      errors: [] as string[],
    };

    // 1. Delete screenshot file from server
    if (screenshotUrl) {
      try {
        // Extract filename from URL (e.g., /api/files/screenshots/filename.png -> filename.png)
        const filename = screenshotUrl.split("/").pop();
        if (filename) {
          const filepath = join(
            process.cwd(),
            "uploads",
            "screenshots",
            filename
          );

          if (existsSync(filepath)) {
            await unlink(filepath);
            cleanupResults.screenshotDeleted = true;
            console.log("✅ Screenshot file deleted:", filename);
          } else {
            console.log("⚠️ Screenshot file not found:", filename);
          }
        }
      } catch (error) {
        console.error("❌ Error deleting screenshot:", error);
        cleanupResults.errors.push(
          `Screenshot deletion failed: ${error.message}`
        );
      }
    }

    // 2. Delete AI explanation from database
    if (explanationId) {
      try {
        await connectDB();
        const result = await AIExplanation.findByIdAndDelete(explanationId);

        if (result) {
          cleanupResults.explanationDeleted = true;
          console.log(
            "✅ AI explanation deleted from database:",
            explanationId
          );
        } else {
          console.log(
            "⚠️ AI explanation not found in database:",
            explanationId
          );
        }
      } catch (error) {
        console.error("❌ Error deleting AI explanation:", error);
        cleanupResults.errors.push(
          `Database deletion failed: ${error.message}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: cleanupResults,
      message: "Cleanup completed",
    });
  } catch (error) {
    console.error("❌ Cleanup API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Cleanup failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
