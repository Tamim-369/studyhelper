'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Download, Eye, Loader2, RefreshCw, Cloud } from 'lucide-react';

// Declare Cloudinary widget types
declare global {
  interface Window {
    cloudinary: any;
  }
}

interface UploadedBook {
  _id: string;
  title: string;
  author: string;
  fileName: string;
  fileSize: number;
  cloudinaryId: string;
  cloudinaryUrl: string;
  uploadedAt: string;
}

export default function CloudinaryUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedBooks, setUploadedBooks] = useState<UploadedBook[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fetch existing Cloudinary books
  const fetchExistingBooks = async () => {
    setLoadingBooks(true);
    try {
      const response = await fetch('/api/books/my-cloudinary-books');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUploadedBooks(data.data.books || []);
        }
      }
    } catch (error) {
      console.error('Error fetching existing books:', error);
    } finally {
      setLoadingBooks(false);
    }
  };

  // Load existing books on component mount
  useEffect(() => {
    fetchExistingBooks();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    // Check file size (1GB limit)
    const maxSize = 1024 * 1024 * 1024; // 1GB
    if (file.size > maxSize) {
      alert('File size exceeds 1GB limit');
      return;
    }

    // Show file size info
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`📊 Uploading file: ${file.name} (${fileSizeMB} MB)`);

    setUploading(true);
    setUploadProgress(0);

    try {
      await uploadFileInChunks(file);
      alert('File uploaded successfully to Cloudinary!');
      fetchExistingBooks();
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const uploadFileInChunks = async (file: File) => {
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`📦 Splitting file into ${totalChunks} chunks of ${chunkSize / 1024 / 1024}MB each`);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('fileName', file.name);
      formData.append('fileId', fileId);
      formData.append('title', file.name.replace('.pdf', ''));
      formData.append('author', 'Unknown');
      formData.append('description', '');
      formData.append('totalSize', file.size.toString());

      console.log(`📤 Uploading chunk ${chunkIndex + 1}/${totalChunks}`);

      const response = await fetch('/api/upload-chunk', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to upload chunk ${chunkIndex + 1}`);
      }

      const result = await response.json();

      // Update progress based on chunks uploaded
      const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
      setUploadProgress(progress);

      if (result.success && result.data) {
        // Final chunk uploaded successfully
        console.log('✅ All chunks uploaded and file assembled');
        return result.data;
      }
    }
  };

  const handleViewInCloudinary = (cloudinaryUrl: string) => {
    window.open(cloudinaryUrl, '_blank');
  };

  const handleDownload = (cloudinaryUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = cloudinaryUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInReader = (bookId: string) => {
    window.open(`/reader/${bookId}`, '_blank');
  };

  // No authentication required - remove this entire section

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <Cloud className="h-12 w-12 mx-auto mb-4 text-blue-500" />
        <h1 className="text-3xl font-bold mb-2">Upload PDF to Cloudinary</h1>
        <p className="text-gray-600">
          Upload your PDF files to Cloudinary cloud storage (up to 1GB each) - No sign-in required!
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Upload PDF File</h2>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">Choose a PDF file to upload</p>
          <p className="text-sm text-gray-500 mb-4">Maximum file size: 1GB • Frontend chunked upload (5MB chunks)</p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading... {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Select PDF File
              </>
            )}
          </Button>

          {/* Progress Bar */}
          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Upload Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Uploading in 5MB chunks for reliable large file transfer
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recently Uploaded Books */}
      {(uploadedBooks.length > 0 || loadingBooks) && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recently Uploaded Books ({uploadedBooks.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExistingBooks}
              disabled={loadingBooks}
              title="Refresh books list"
            >
              {loadingBooks ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          {loadingBooks ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-gray-600">Loading your books...</span>
            </div>
          ) : uploadedBooks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No books uploaded yet</p>
              <p className="text-sm">Upload your first PDF to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uploadedBooks.map((book) => (
                <div key={book._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{book.title}</h4>
                      <p className="text-sm text-gray-600">by {book.author}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{book.fileName}</span>
                        <span>{formatFileSize(book.fileSize)}</span>
                        <span>{new Date(book.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInCloudinary(book.cloudinaryUrl)}
                        title="View in Cloudinary"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(book.cloudinaryUrl, book.fileName)}
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleOpenInReader(book._id)}
                        title="Open in StudyHelper Reader"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Open
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
