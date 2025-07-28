import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const paramsToSign = await request.json();

    console.log("📝 Params to sign:", paramsToSign);

    // Remove any undefined or null values and prepare params for signing
    const cleanParams: Record<string, any> = {};

    // Add timestamp if not provided
    if (!paramsToSign.timestamp) {
      cleanParams.timestamp = Math.round(new Date().getTime() / 1000);
    }

    // Copy all provided parameters, filtering out undefined/null values
    Object.keys(paramsToSign).forEach((key) => {
      if (
        paramsToSign[key] !== undefined &&
        paramsToSign[key] !== null &&
        paramsToSign[key] !== ""
      ) {
        cleanParams[key] = paramsToSign[key];
      }
    });

    console.log("🔐 Clean params for signing:", cleanParams);

    // Create signature for secure upload
    const signature = cloudinary.utils.api_sign_request(
      cleanParams,
      process.env.CLOUDINARY_API_SECRET!
    );

    console.log("✅ Generated signature:", signature);

    return NextResponse.json({
      signature,
      timestamp: cleanParams.timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (error) {
    console.error("❌ Error generating Cloudinary signature:", error);
    return NextResponse.json(
      { error: "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
