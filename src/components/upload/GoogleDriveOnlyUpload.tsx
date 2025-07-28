'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Download, Eye, Loader2, RefreshCw, HardDrive } from 'lucide-react';
import { GoogleDriveClientService } from '@/lib/googleDriveClient';

interface UploadedBook {
  _id: string;
  title: string;
  author: string;
  fileName: string;
  fileSize: number;
  googleDriveId: string;
  viewLink: string;
  uploadedAt: string;
}

export default function GoogleDriveOnlyUpload() {
  const { data: session, status } = useSession();
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

  // Fetch user's existing Google Drive books
  const fetchExistingBooks = async () => {
    if (!session) return;

    setLoadingBooks(true);
    try {
      const response = await fetch('/api/books/my-drive-books');
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

  // Load existing books when user signs in
  useEffect(() => {
    if (session) {
      fetchExistingBooks();
    } else {
      setUploadedBooks([]);
    }
  }, [session]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    // Check file size (Google Drive supports up to 5TB)
    const maxSize = 5 * 1024 * 1024 * 1024 * 1024; // 5TB (Google Drive limit)
    if (file.size > maxSize) {
      alert(`File size exceeds Google Drive's 5TB limit. Please use a smaller file.`);
      return;
    }

    // Show file size info
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`📊 Uploading file to Google Drive: ${file.name} (${fileSizeMB} MB)`);

    setUploading(true);
    setUploadProgress(0);

    try {
      const sessionWithToken = session as any;
      if (!sessionWithToken?.accessToken) {
        alert('Google Drive access token not available. Please sign in again.');
        return;
      }

      // Upload directly to Google Drive from browser
      const driveService = new GoogleDriveClientService(sessionWithToken.accessToken);

      const uploadResult = await driveService.uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      console.log('📤 Direct upload completed:', uploadResult);

      // Save book metadata to our database
      const metadataResponse = await fetch('/api/save-drive-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleDriveId: uploadResult.id,
          title: file.name.replace('.pdf', ''),
          author: 'Unknown',
          description: '',
          fileName: file.name,
          fileSize: file.size.toString(),
          webViewLink: uploadResult.webViewLink,
          webContentLink: uploadResult.webContentLink,
        }),
      });

      const result = await metadataResponse.json();

      if (result.success) {
        alert('File uploaded successfully to Google Drive!');
        fetchExistingBooks();
      } else {
        console.error('Upload failed:', result);
        if (result.error?.includes('10MB limit')) {
          alert(`Upload failed: File too large. Please use files smaller than 10MB.`);
        } else if (result.error?.includes('413')) {
          alert(`Upload failed: File size exceeds server limits. Please use a smaller file.`);
        } else {
          alert(`Upload failed: ${result.error || 'Unknown error occurred'}`);
        }
      }

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

  const handleViewInGoogleDrive = (viewLink: string) => {
    window.open(viewLink, '_blank');
  };

  const handleOpenInReader = (bookId: string) => {
    window.open(`/reader/${bookId}`, '_blank');
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <HardDrive className="h-16 w-16 mx-auto mb-4 text-green-500" />
        <h2 className="text-2xl font-bold mb-4">Upload to Google Drive</h2>
        <p className="text-gray-600 mb-6">
          Sign in to upload your PDF files directly to Google Drive<br />
          <span className="text-sm">• Supports files up to 5TB (Google Drive limit)</span><br />
          <span className="text-sm">• 15GB free Google Drive storage</span><br />
          <span className="text-sm">• Direct browser-to-Drive upload</span><br />
          <span className="text-sm">• Access from anywhere</span>
        </p>
        <Button onClick={() => signIn('google')} size="lg">
          Sign in with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <HardDrive className="h-12 w-12 mx-auto mb-4 text-green-500" />
        <h1 className="text-3xl font-bold mb-2">Google Drive Direct Upload</h1>
        <p className="text-gray-600">
          Upload your PDF files directly to Google Drive (up to 5TB each)
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Upload PDF File</h2>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">Choose a PDF file to upload</p>
          <p className="text-sm text-gray-500 mb-4">Maximum file size: 5TB • Direct browser-to-Google Drive upload</p>

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
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Uploading directly to Google Drive (bypassing server limits)...
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
              Your Google Drive Books ({uploadedBooks.length})
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
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-lg">{book.title}</h4>
                        <HardDrive className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-sm text-gray-600">by {book.author}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{book.fileName}</span>
                        <span>{formatFileSize(book.fileSize)}</span>
                        <span>{new Date(book.uploadedAt).toLocaleDateString()}</span>
                        <span>Google Drive</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInGoogleDrive(book.viewLink)}
                        title="View in Google Drive"
                      >
                        <Eye className="h-4 w-4" />
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
