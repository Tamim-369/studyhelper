'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Download, Eye, Loader2, RefreshCw, Cloud, HardDrive } from 'lucide-react';

interface UploadedBook {
  _id: string;
  title: string;
  author: string;
  fileName: string;
  fileSize: number;
  storageType: 'cloudinary' | 'google-drive';
  cloudinaryId?: string;
  cloudinaryUrl?: string;
  googleDriveId?: string;
  viewLink?: string;
  uploadedAt: string;
}

export default function HybridUpload() {
  const { data: session, status } = useSession();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedBooks, setUploadedBooks] = useState<UploadedBook[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [storageFilter, setStorageFilter] = useState<'all' | 'cloudinary' | 'google-drive'>('all');
  const [storageCounts, setStorageCounts] = useState({ total: 0, cloudinary: 0, 'google-drive': 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fetch user's existing books
  const fetchExistingBooks = async () => {
    if (!session) return;

    setLoadingBooks(true);
    try {
      const url = new URL('/api/books/my-books', window.location.origin);
      if (storageFilter !== 'all') {
        url.searchParams.set('storageType', storageFilter);
      }

      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUploadedBooks(data.data.books || []);
          setStorageCounts(data.data.storageCounts || { total: 0, cloudinary: 0, 'google-drive': 0 });
        }
      }
    } catch (error) {
      console.error('Error fetching existing books:', error);
    } finally {
      setLoadingBooks(false);
    }
  };

  // Load existing books when user signs in or filter changes
  useEffect(() => {
    if (session) {
      fetchExistingBooks();
    } else {
      setUploadedBooks([]);
    }
  }, [session, storageFilter]);

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

    // Show file size info and storage recommendation
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const storageType = parseFloat(fileSizeMB) > 50 ? 'Google Drive' : 'Cloudinary';
    console.log(`📊 Uploading file: ${file.name} (${fileSizeMB} MB) → ${storageType}`);

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace('.pdf', ''));
      formData.append('author', 'Unknown');
      formData.append('description', '');

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', '/api/upload-hybrid');
        xhr.send(formData);
      });

      const result = await uploadPromise as any;

      if (result.success) {
        alert(`File uploaded successfully to ${result.data.storageType === 'google-drive' ? 'Google Drive' : 'Cloudinary'}!`);
        fetchExistingBooks();
      } else {
        alert(`Upload failed: ${result.error}`);
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

  const handleViewFile = (book: UploadedBook) => {
    if (book.storageType === 'google-drive' && book.viewLink) {
      window.open(book.viewLink, '_blank');
    } else if (book.storageType === 'cloudinary' && book.cloudinaryUrl) {
      window.open(book.cloudinaryUrl, '_blank');
    }
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
        <div className="flex justify-center gap-4 mb-4">
          <Cloud className="h-12 w-12 text-blue-500" />
          <HardDrive className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Smart PDF Upload</h2>
        <p className="text-gray-600 mb-6">
          Sign in to upload PDFs with automatic storage selection:<br/>
          <span className="text-sm">• Small files (&lt;50MB) → Cloudinary</span><br/>
          <span className="text-sm">• Large files (≥50MB) → Google Drive</span>
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
        <div className="flex justify-center gap-4 mb-4">
          <Cloud className="h-10 w-10 text-blue-500" />
          <HardDrive className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Smart PDF Upload</h1>
        <p className="text-gray-600">
          Automatic storage selection: Small files (&lt;50MB) → Cloudinary, Large files (≥50MB) → Google Drive
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Upload PDF File</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">Choose a PDF file to upload</p>
          <p className="text-sm text-gray-500 mb-4">Maximum file size: 1GB • Smart storage selection</p>
          
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
                Smart storage selection in progress...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Books List with Storage Filter */}
      {(uploadedBooks.length > 0 || loadingBooks) && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Your Books ({storageCounts.total})
            </h3>
            <div className="flex items-center gap-2">
              {/* Storage Filter */}
              <select
                value={storageFilter}
                onChange={(e) => setStorageFilter(e.target.value as any)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="all">All ({storageCounts.total})</option>
                <option value="cloudinary">Cloudinary ({storageCounts.cloudinary})</option>
                <option value="google-drive">Google Drive ({storageCounts['google-drive']})</option>
              </select>
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
          </div>
          
          {loadingBooks ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-gray-600">Loading your books...</span>
            </div>
          ) : uploadedBooks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No books found</p>
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
                        {book.storageType === 'google-drive' ? (
                          <HardDrive className="h-4 w-4 text-green-500" title="Google Drive" />
                        ) : (
                          <Cloud className="h-4 w-4 text-blue-500" title="Cloudinary" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">by {book.author}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{book.fileName}</span>
                        <span>{formatFileSize(book.fileSize)}</span>
                        <span>{new Date(book.uploadedAt).toLocaleDateString()}</span>
                        <span className="capitalize">{book.storageType.replace('-', ' ')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewFile(book)}
                        title={`View in ${book.storageType === 'google-drive' ? 'Google Drive' : 'Cloudinary'}`}
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
