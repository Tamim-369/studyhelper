import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import connectDB from "@/lib/db/connection";
import Book from "@/lib/db/models/Book";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const TEMP_DIR = path.join(process.cwd(), "temp");

// Ensure temp directory exists
async function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTempDir();

    const formData = await request.formData();
    const chunk = formData.get("chunk") as File;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const totalChunks = parseInt(formData.get("totalChunks") as string);
    const fileName = formData.get("fileName") as string;
    const fileId = formData.get("fileId") as string;
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const description = formData.get("description") as string;
    const totalSize = parseInt(formData.get("totalSize") as string);

    if (!chunk || !fileName || !fileId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    console.log(
      `📦 Received chunk ${chunkIndex + 1}/${totalChunks} for ${fileName}`
    );

    // Save chunk to temporary file
    const chunkPath = path.join(TEMP_DIR, `${fileId}_chunk_${chunkIndex}`);
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
    await writeFile(chunkPath, chunkBuffer);

    // Check if all chunks are received
    const allChunksReceived = await checkAllChunks(fileId, totalChunks);

    if (!allChunksReceived) {
      return NextResponse.json({
        success: true,
        message: `Chunk ${chunkIndex + 1}/${totalChunks} received`,
        progress: Math.round(((chunkIndex + 1) / totalChunks) * 100),
      });
    }

    console.log(`🔄 All chunks received for ${fileName}, assembling file...`);

    // Assemble all chunks into final file
    const finalFilePath = path.join(TEMP_DIR, `${fileId}_complete`);
    const finalBuffer = await assembleChunks(fileId, totalChunks);
    await writeFile(finalFilePath, finalBuffer);

    console.log(
      `📤 Uploading assembled file to Cloudinary: ${fileName} (${(
        finalBuffer.length /
        1024 /
        1024
      ).toFixed(2)} MB)`
    );

    // Upload to Cloudinary using chunked upload
    const uploadResult = await uploadToCloudinaryChunked(finalBuffer, fileName);

    // Save metadata to database
    await connectDB();

    const book = new Book({
      title: title || fileName.replace(".pdf", ""),
      author: author || "Unknown",
      description: description || "",
      fileName,
      fileSize: totalSize,
      totalPages: 0,
      uploadedBy: "anonymous",
      uploadedAt: new Date(),
      isPublic: true,
      tags: [],
      cloudinaryId: (uploadResult as any).id,
      cloudinaryUrl: (uploadResult as any).url,
      storageType: "cloudinary",
      userId: "anonymous",
      mimeType: "application/pdf",
    });

    const savedBook = await book.save();

    // Clean up temporary files
    await cleanupTempFiles(fileId, totalChunks);
    await unlink(finalFilePath);

    console.log("✅ Book saved to database:", savedBook._id);

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
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
    console.error("❌ Error in chunked upload:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}

async function checkAllChunks(
  fileId: string,
  totalChunks: number
): Promise<boolean> {
  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(TEMP_DIR, `${fileId}_chunk_${i}`);
    if (!existsSync(chunkPath)) {
      return false;
    }
  }
  return true;
}

async function assembleChunks(
  fileId: string,
  totalChunks: number
): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(TEMP_DIR, `${fileId}_chunk_${i}`);
    const chunkBuffer = await readFile(chunkPath);
    chunks.push(chunkBuffer);
  }

  return Buffer.concat(chunks);
}

async function uploadToCloudinaryChunked(fileBuffer: Buffer, fileName: string) {
  const totalSize = fileBuffer.length;

  console.log(
    `🔄 Uploading ${fileName} to Cloudinary (${(
      totalSize /
      1024 /
      1024
    ).toFixed(2)} MB)`
  );

  // For files smaller than 50MB, use regular upload
  if (totalSize < 50 * 1024 * 1024) {
    console.log("📤 File is small enough for regular upload");
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "studyhelper/pdfs/anonymous",
          public_id: `${Date.now()}_${fileName.replace(/\.[^/.]+$/, "")}`,
          use_filename: true,
          unique_filename: true,
          tags: ["pdf", "studyhelper", "anonymous"],
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
              originalFilename: fileName,
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
  }

  // For larger files, your Cloudinary account may have size limits
  // Let's try with a smaller chunk size and different approach
  try {
    console.log("📤 Attempting upload with smaller chunks");

    // Try uploading with stream but smaller chunks
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "studyhelper/pdfs/anonymous",
          public_id: `${Date.now()}_${fileName.replace(/\.[^/.]+$/, "")}`,
          use_filename: true,
          unique_filename: true,
          tags: ["pdf", "studyhelper", "anonymous", "large-file"],
          timeout: 600000, // 10 minutes timeout
          // Remove chunk_size to let Cloudinary handle it automatically
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload error:", error);

            // If it's a 413 error, the file is too large for your Cloudinary plan
            if (error.http_code === 413) {
              reject(
                new Error(
                  `File too large for your Cloudinary plan. File size: ${(
                    totalSize /
                    1024 /
                    1024
                  ).toFixed(
                    2
                  )}MB. Consider upgrading your Cloudinary plan or using a smaller file.`
                )
              );
            } else {
              reject(error);
            }
          } else {
            console.log("✅ Large file upload successful:", result?.public_id);
            resolve({
              id: result?.public_id,
              url: result?.secure_url,
              originalFilename: fileName,
              size: result?.bytes,
              format: result?.format,
              resourceType: result?.resource_type,
              createdAt: result?.created_at,
            });
          }
        }
      );

      // Write the buffer in smaller chunks to the stream
      const streamChunkSize = 1024 * 1024; // 1MB chunks for streaming
      let offset = 0;

      const writeNextChunk = () => {
        if (offset >= fileBuffer.length) {
          uploadStream.end();
          return;
        }

        const chunk = fileBuffer.slice(
          offset,
          Math.min(offset + streamChunkSize, fileBuffer.length)
        );
        uploadStream.write(chunk);
        offset += streamChunkSize;

        // Use setImmediate to avoid blocking
        setImmediate(writeNextChunk);
      };

      writeNextChunk();
    });
  } catch (error) {
    console.error("❌ Cloudinary large file upload failed:", error);
    throw error;
  }
}

async function cleanupTempFiles(
  fileId: string,
  totalChunks: number
): Promise<void> {
  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(TEMP_DIR, `${fileId}_chunk_${i}`);
    try {
      await unlink(chunkPath);
    } catch (error) {
      console.warn(`Failed to delete chunk ${i}:`, error);
    }
  }
}
