// Client-side Google Drive upload service
// This bypasses Vercel serverless function limits by uploading directly from browser

export interface GoogleDriveUploadResult {
  id: string;
  name: string;
  size: string;
  webViewLink: string;
  webContentLink: string;
}

export class GoogleDriveClientService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // Get upload URL for resumable uploads (supports large files)
  async getResumableUploadUrl(fileName: string, fileSize: number): Promise<string> {
    const metadata = {
      name: fileName,
      parents: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID 
        ? [process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID] 
        : undefined,
    };

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': 'application/pdf',
          'X-Upload-Content-Length': fileSize.toString(),
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.statusText}`);
    }

    const uploadUrl = response.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('No upload URL returned from Google Drive');
    }

    return uploadUrl;
  }

  // Upload file using resumable upload (supports files up to 5TB)
  async uploadFileResumable(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<GoogleDriveUploadResult> {
    console.log(`🚀 Starting direct Google Drive upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Get resumable upload URL
    const uploadUrl = await this.getResumableUploadUrl(file.name, file.size);

    // Upload the file in chunks
    const chunkSize = 256 * 1024 * 1024; // 256MB chunks
    let uploadedBytes = 0;

    while (uploadedBytes < file.size) {
      const chunk = file.slice(uploadedBytes, Math.min(uploadedBytes + chunkSize, file.size));
      const isLastChunk = uploadedBytes + chunk.size >= file.size;

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes ${uploadedBytes}-${uploadedBytes + chunk.size - 1}/${file.size}`,
        },
        body: chunk,
      });

      if (response.status === 308) {
        // Continue uploading
        const range = response.headers.get('Range');
        if (range) {
          const rangeMatch = range.match(/bytes=0-(\d+)/);
          if (rangeMatch) {
            uploadedBytes = parseInt(rangeMatch[1]) + 1;
          }
        } else {
          uploadedBytes += chunk.size;
        }
      } else if (response.status === 200 || response.status === 201) {
        // Upload complete
        const result = await response.json();
        console.log('✅ Upload completed successfully:', result.id);
        
        return {
          id: result.id,
          name: result.name,
          size: result.size || file.size.toString(),
          webViewLink: result.webViewLink,
          webContentLink: result.webContentLink,
        };
      } else {
        throw new Error(`Upload failed with status ${response.status}: ${response.statusText}`);
      }

      // Report progress
      if (onProgress) {
        const progress = Math.round((uploadedBytes / file.size) * 100);
        onProgress(progress);
      }
    }

    throw new Error('Upload completed but no response received');
  }

  // Simple upload for smaller files (under 5MB)
  async uploadFileSimple(file: File): Promise<GoogleDriveUploadResult> {
    console.log(`📤 Simple upload to Google Drive: ${file.name}`);

    const metadata = {
      name: file.name,
      parents: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID 
        ? [process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID] 
        : undefined,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: form,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Simple upload completed:', result.id);

    return {
      id: result.id,
      name: result.name,
      size: result.size || file.size.toString(),
      webViewLink: result.webViewLink,
      webContentLink: result.webContentLink,
    };
  }

  // Auto-choose upload method based on file size
  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<GoogleDriveUploadResult> {
    const fiveMB = 5 * 1024 * 1024;
    
    if (file.size <= fiveMB) {
      return this.uploadFileSimple(file);
    } else {
      return this.uploadFileResumable(file, onProgress);
    }
  }
}
