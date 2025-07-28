import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import connectDB from "@/lib/db/connection";
import Book from "@/lib/db/models/Book";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
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

    console.log(
      `📊 File info: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
    );

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary with chunking
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "studyhelper/pdfs/anonymous",
          public_id: `${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}`,
          use_filename: true,
          unique_filename: true,
          tags: ["pdf", "studyhelper", "anonymous"],
          // Enable chunked upload for large files
          chunk_size: 20000000, // 20MB chunks
          timeout: 300000, // 5 minutes timeout
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload error:", error);
            reject(error);
          } else {
            console.log("✅ Upload successful:", result?.public_id);
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

      // Write the buffer to the stream in chunks
      const chunkSize = 1024 * 1024; // 1MB chunks for writing to stream
      let offset = 0;
      
      const writeChunk = () => {
        if (offset >= fileBuffer.length) {
          uploadStream.end();
          return;
        }
        
        const chunk = fileBuffer.slice(offset, offset + chunkSize);
        uploadStream.write(chunk);
        offset += chunkSize;
        
        // Use setImmediate to avoid blocking the event loop
        setImmediate(writeChunk);
      };
      
      writeChunk();
    });

    // Connect to database and save book metadata
    await connectDB();

    const book = new Book({
      title: title || file.name.replace(".pdf", ""),
      author: author || "Unknown",
      description: description || "",
      fileName: file.name,
      fileSize: file.size,
      totalPages: 0, // Will be updated when PDF is processed
      uploadedBy: "anonymous",
      uploadedAt: new Date(),
      isPublic: true, // Make all uploads public since no auth
      tags: [],
      cloudinaryId: (uploadResult as any).id,
      cloudinaryUrl: (uploadResult as any).url,
      storageType: "cloudinary",
      userId: "anonymous",
      mimeType: file.type,
    });

    const savedBook = await book.save();

    console.log("✅ Book saved to database:", savedBook._id);

    return NextResponse.json({
      success: true,
      message: "File uploaded to Cloudinary successfully",
      data: {
        bookId: savedBook._id,
        title: savedBook.title,
        author: savedBook.author,
        fileName: savedBook.fileName,
        fileSize: savedBook.fileSize,
        cloudinaryId: (uploadResult as any).id,
        cloudinaryUrl: (uploadResult as any).url,
        uploadedAt: savedBook.uploadedAt,
      },
    });
  } catch (error: any) {
    console.error("❌ Error uploading to Cloudinary:", error);

    if (error.http_code === 413) {
      return NextResponse.json(
        { error: "File too large. Please try a smaller file." },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
