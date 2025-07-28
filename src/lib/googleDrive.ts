import { google } from "googleapis";
import { Readable } from "stream";

// Error types for better error handling
export class GoogleDriveError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = "GoogleDriveError";
  }
}

export class GoogleDriveAuthError extends GoogleDriveError {
  constructor(message: string = "Google Drive authentication failed") {
    super(message, 401, "AUTH_ERROR");
    this.name = "GoogleDriveAuthError";
  }
}

export class GoogleDriveService {
  private drive;
  private auth;

  constructor(accessToken: string, refreshToken?: string) {
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    this.auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    this.drive = google.drive({ version: "v3", auth: this.auth });
  }

  // Handle API errors and convert them to our custom error types
  private handleError(error: any, operation: string): never {
    console.error(`❌ Google Drive ${operation} error:`, error);

    if (error.code === 401 || error.message?.includes("unauthorized")) {
      throw new GoogleDriveAuthError(
        `Authentication failed during ${operation}`
      );
    }

    if (error.code === 403) {
      throw new GoogleDriveError(
        `Access denied during ${operation}`,
        403,
        "ACCESS_DENIED"
      );
    }

    if (error.code === 404) {
      throw new GoogleDriveError(
        `File not found during ${operation}`,
        404,
        "NOT_FOUND"
      );
    }

    if (error.code === 429) {
      throw new GoogleDriveError(
        `Rate limit exceeded during ${operation}`,
        429,
        "RATE_LIMIT"
      );
    }

    throw new GoogleDriveError(
      `Failed to ${operation}: ${error.message || "Unknown error"}`,
      error.code || 500,
      "UNKNOWN_ERROR"
    );
  }

  // Check if we have valid credentials
  async checkAuth(): Promise<boolean> {
    try {
      await this.drive.about.get({ fields: "user" });
      return true;
    } catch (error) {
      return false;
    }
  }

  async uploadFile(file: Buffer, fileName: string, mimeType: string) {
    try {
      const fileMetadata = {
        name: fileName,
        parents: process.env.GOOGLE_DRIVE_FOLDER_ID
          ? [process.env.GOOGLE_DRIVE_FOLDER_ID]
          : undefined,
      };

      const media = {
        mimeType: mimeType,
        body: Readable.from(file),
      };

      console.log("📤 Uploading to Google Drive:", fileName);

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id,name,webViewLink,webContentLink,size",
      });

      // Make file publicly readable
      await this.drive.permissions.create({
        fileId: response.data.id!,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      console.log("✅ Upload successful:", response.data.name);

      return {
        id: response.data.id,
        name: response.data.name,
        viewLink: response.data.webViewLink,
        downloadLink: `https://drive.google.com/uc?export=download&id=${response.data.id}`,
        directLink: `https://drive.google.com/file/d/${response.data.id}/view`,
        size: response.data.size,
      };
    } catch (error) {
      this.handleError(error, "upload file");
    }
  }

  async deleteFile(fileId: string) {
    try {
      await this.drive.files.delete({ fileId });
      console.log("🗑️ File deleted from Google Drive:", fileId);
      return true;
    } catch (error) {
      this.handleError(error, "delete file");
    }
  }

  async getFile(fileId: string) {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: "id,name,webViewLink,webContentLink,size,createdTime",
      });
      return response.data;
    } catch (error) {
      this.handleError(error, "get file");
    }
  }

  async listFiles(pageSize = 10) {
    try {
      const response = await this.drive.files.list({
        pageSize,
        fields:
          "nextPageToken, files(id, name, size, createdTime, webViewLink)",
        q: "mimeType='application/pdf'", // Only PDF files
      });
      return response.data.files || [];
    } catch (error) {
      this.handleError(error, "list files");
    }
  }

  async downloadFile(fileId: string) {
    try {
      const response = await this.drive.files.get(
        {
          fileId,
          alt: "media",
        },
        {
          responseType: "stream",
        }
      );

      console.log("📥 Downloading file from Google Drive:", fileId);
      return response.data;
    } catch (error) {
      this.handleError(error, "download file");
    }
  }
}
