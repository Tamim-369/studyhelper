import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Error types for better error handling
export class CloudinaryError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = "CloudinaryError";
  }
}

export class CloudinaryService {
  // Handle API errors and convert them to our custom error types
  private handleError(error: any, operation: string): never {
    console.error(`❌ Cloudinary ${operation} error:`, error);

    if (error.http_code === 401) {
      throw new CloudinaryError(
        `Authentication failed during ${operation}`,
        401,
        "AUTH_ERROR"
      );
    }

    if (error.http_code === 403) {
      throw new CloudinaryError(
        `Access denied during ${operation}`,
        403,
        "ACCESS_DENIED"
      );
    }

    if (error.http_code === 413) {
      throw new CloudinaryError(
        `File too large during ${operation}`,
        413,
        "FILE_TOO_LARGE"
      );
    }

    if (error.http_code === 429) {
      throw new CloudinaryError(
        `Rate limit exceeded during ${operation}`,
        429,
        "RATE_LIMIT"
      );
    }

    throw new CloudinaryError(
      `Failed to ${operation}: ${error.message || "Unknown error"}`,
      error.http_code || 500,
      "UNKNOWN_ERROR"
    );
  }

  // Upload PDF file to Cloudinary with chunked upload for large files
  async uploadPDF(fileBuffer: Buffer, fileName: string, userId: string) {
    try {
      console.log(
        "📤 Uploading PDF to Cloudinary:",
        fileName,
        `(${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB)`
      );

      // For files larger than 100MB, use chunked upload
      const fileSizeMB = fileBuffer.length / 1024 / 1024;
      const useChunkedUpload = fileSizeMB > 100;

      const uploadOptions = {
        resource_type: "raw" as const,
        folder: `studyhelper/pdfs/${userId}`,
        public_id: `${Date.now()}_${fileName.replace(/\.[^/.]+$/, "")}`,
        use_filename: true,
        unique_filename: true,
        tags: ["pdf", "studyhelper", userId],
        // Enable chunked upload for large files
        ...(useChunkedUpload && {
          chunk_size: 20000000, // 20MB chunks
          eager_async: true,
        }),
      };

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
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

        // Write the buffer to the stream
        uploadStream.end(fileBuffer);
      });
    } catch (error) {
      this.handleError(error, "upload PDF");
    }
  }

  // Get PDF file URL from Cloudinary
  async getPDFUrl(publicId: string): Promise<string> {
    try {
      // Generate a secure URL for the PDF
      const url = cloudinary.url(publicId, {
        resource_type: "raw",
        secure: true,
        sign_url: true, // Add signature for security
        expires_at: Math.floor(Date.now() / 1000) + 3600, // Expire in 1 hour
      });

      console.log("📥 Generated PDF URL for:", publicId);
      return url;
    } catch (error) {
      this.handleError(error, "get PDF URL");
    }
  }

  // Delete PDF from Cloudinary
  async deletePDF(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "raw",
      });

      console.log("🗑️ PDF deleted from Cloudinary:", publicId);
      return result.result === "ok";
    } catch (error) {
      this.handleError(error, "delete PDF");
    }
  }

  // List PDFs for a user
  async listUserPDFs(userId: string, maxResults: number = 50) {
    try {
      const result = await cloudinary.search
        .expression(`folder:studyhelper/pdfs/${userId} AND resource_type:raw`)
        .sort_by([["created_at", "desc"]])
        .max_results(maxResults)
        .execute();

      console.log(`📋 Found ${result.resources.length} PDFs for user:`, userId);
      return result.resources.map((resource: any) => ({
        id: resource.public_id,
        url: resource.secure_url,
        filename: resource.filename,
        size: resource.bytes,
        format: resource.format,
        createdAt: resource.created_at,
        tags: resource.tags,
      }));
    } catch (error) {
      this.handleError(error, "list user PDFs");
    }
  }

  // Get file info
  async getFileInfo(publicId: string) {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: "raw",
      });

      return {
        id: result.public_id,
        url: result.secure_url,
        filename: result.filename,
        size: result.bytes,
        format: result.format,
        createdAt: result.created_at,
        tags: result.tags,
      };
    } catch (error) {
      this.handleError(error, "get file info");
    }
  }
}

export default CloudinaryService;
