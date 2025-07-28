import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { v2 as cloudinary } from 'cloudinary';
import { GoogleDriveService } from "@/lib/googleDrive";
import connectDB from "@/lib/db/connection";
import Book from "@/lib/db/models/Book";
import { authOptions } from "@/lib/auth";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const description = formData.get("description") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (1GB limit)
    const maxSize = 1024 * 1024 * 1024; // 1GB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    const fileSizeMB = file.size / 1024 / 1024;
    console.log(`📊 File info: ${file.name} (${fileSizeMB.toFixed(2)} MB)`);

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    let uploadResult: any;
    let storageType: string;

    // Use Google Drive for files larger than 50MB, Cloudinary for smaller files
    if (fileSizeMB > 50) {
      console.log("📤 Using Google Drive for large file");
      
      if (!session.accessToken) {
        return NextResponse.json(
          { error: "Google Drive access token not available. Please sign in again." },
          { status: 401 }
        );
      }

      const googleDriveService = new GoogleDriveService();
      uploadResult = await googleDriveService.uploadPDF(
        fileBuffer,
        file.name,
        session.accessToken
      );
      storageType = "google-drive";
    } else {
      console.log("📤 Using Cloudinary for small file");
      
      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            folder: "studyhelper/pdfs/small",
            public_id: `${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}`,
            use_filename: true,
            unique_filename: true,
            tags: ["pdf", "studyhelper", "small-file"],
            timeout: 300000,
          },
          (error, result) => {
            if (error) {
              console.error("❌ Cloudinary upload error:", error);
              reject(error);
            } else {
              console.log("✅ Cloudinary upload successful:", result?.public_id);
              resolve({
                id: result?.public_id,
                url: result?.secure_url,
                originalFilename: file.name,
                size: result?.bytes,
                format: result?.format,
                resourceType: result?.resource_type,
                createdAt: result?.created_at,
              });
            }
          }
        );
        uploadStream.end(fileBuffer);
      });
      storageType = "cloudinary";
    }

    // Connect to database and save book metadata
    await connectDB();

    const bookData: any = {
      title: title || file.name.replace(".pdf", ""),
      author: author || "Unknown",
      description: description || "",
      fileName: file.name,
      fileSize: file.size,
      totalPages: 0,
      uploadedBy: session.user.email,
      uploadedAt: new Date(),
      isPublic: false,
      tags: [],
      storageType,
      userId: session.user.email,
      mimeType: file.type,
    };

    if (storageType === "google-drive") {
      bookData.googleDriveId = uploadResult.id;
      bookData.downloadLink = uploadResult.downloadLink;
      bookData.viewLink = uploadResult.viewLink;
      bookData.directLink = uploadResult.directLink;
    } else {
      bookData.cloudinaryId = uploadResult.id;
      bookData.cloudinaryUrl = uploadResult.url;
    }

    const book = new Book(bookData);
    const savedBook = await book.save();

    console.log("✅ Book saved to database:", savedBook._id);

    return NextResponse.json({
      success: true,
      message: `File uploaded successfully to ${storageType === "google-drive" ? "Google Drive" : "Cloudinary"}`,
      data: {
        bookId: savedBook._id,
        title: savedBook.title,
        author: savedBook.author,
        fileName: savedBook.fileName,
        fileSize: savedBook.fileSize,
        storageType,
        uploadedAt: savedBook.uploadedAt,
        ...(storageType === "google-drive" 
          ? { googleDriveId: uploadResult.id, viewLink: uploadResult.viewLink }
          : { cloudinaryId: uploadResult.id, cloudinaryUrl: uploadResult.url }
        ),
      },
    });
  } catch (error: any) {
    console.error("❌ Error in hybrid upload:", error);

    if (error.name === "GoogleDriveError" || error.name === "CloudinaryError") {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
