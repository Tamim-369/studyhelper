'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link2, FileText, Eye, Loader2, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

interface ProcessedBook {
  bookId: string;
  title: string;
  author: string;
  fileName: string;
  fileSize: number;
  googleDriveId: string;
  viewLink: string;
  uploadedAt: string;
  isExisting: boolean;
}

// Admin email - only this user can access admin functions
const ADMIN_EMAIL = 'ashiqurrahmantamim369@gmail.com';

export default function AdminUploadPage() {
  const { data: session, status } = useSession();
  const [processing, setProcessing] = useState(false);
  const [driveUrl, setDriveUrl] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [processedBook, setProcessedBook] = useState<ProcessedBook | null>(null);
  const [error, setError] = useState('');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleProcessLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!driveUrl.trim()) {
      setError('Please enter a Google Drive URL');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!author.trim()) {
      setError('Please enter an author');
      return;
    }

    setProcessing(true);
    setError('');
    setProcessedBook(null);

    try {
      const response = await fetch('/api/admin/process-drive-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driveUrl: driveUrl.trim(),
          title: title.trim(),
          author: author.trim(),
          description: description.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setProcessedBook(result.data);
        setError('');
        
        // Clear form
        setDriveUrl('');
        setTitle('');
        setAuthor('');
        setDescription('');
      } else {
        setError(result.error || 'Failed to process Google Drive link');
      }

    } catch (error: any) {
      console.error('Error processing link:', error);
      setError('Failed to process Google Drive link. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenInReader = (bookId: string) => {
    window.open(`/reader/${bookId}`, '_blank');
  };

  const handleViewInGoogleDrive = (viewLink: string) => {
    window.open(viewLink, '_blank');
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600">Please sign in to access admin functions.</p>
        </div>
      </div>
    );
  }

  if (session.user?.email !== ADMIN_EMAIL) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 mt-2">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-green-600" />
          <h1 className="text-3xl font-bold mb-2">Admin Book Upload</h1>
          <p className="text-gray-600">
            Add books to the library via Google Drive links
          </p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Shield className="h-3 w-3 mr-1" />
            Admin Access
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleProcessLink} className="space-y-4">
            <div>
              <Label htmlFor="driveUrl">Google Drive URL *</Label>
              <Input
                id="driveUrl"
                type="url"
                placeholder="https://drive.google.com/file/d/your-file-id/view"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                disabled={processing}
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: https://drive.google.com/file/d/19ukqwKCym4mpfkp75ATDKFomSChGn-v0/view?usp=sharing
              </p>
            </div>

            <div>
              <Label htmlFor="title">Book Title *</Label>
              <Input
                id="title"
                placeholder="Enter the book title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={processing}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                placeholder="Enter the author name"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                disabled={processing}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the book (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={processing}
                className="mt-1"
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={processing || !driveUrl.trim() || !title.trim() || !author.trim()}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing Book...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Add Book to Library
                </>
              )}
            </Button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-medium">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {processedBook && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-green-800 mb-1">
                    {processedBook.isExisting ? 'Book Already in Library' : 'Book Added Successfully'}
                  </h3>
                  <div className="space-y-2">
                    <div className="text-sm text-green-700">
                      <p><strong>Title:</strong> {processedBook.title}</p>
                      <p><strong>Author:</strong> {processedBook.author}</p>
                      <p><strong>File:</strong> {processedBook.fileName}</p>
                      <p><strong>Size:</strong> {formatFileSize(processedBook.fileSize)}</p>
                      <p><strong>Added:</strong> {new Date(processedBook.uploadedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleOpenInReader(processedBook.bookId)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Open in Reader
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInGoogleDrive(processedBook.viewLink)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View in Drive
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">Instructions:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Copy the Google Drive PDF link and paste it above</li>
            <li>• Make sure the file is publicly accessible or shared</li>
            <li>• Fill in the title, author, and description</li>
            <li>• The book will be added to the public library</li>
            <li>• Users can then read it without any Google authentication</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
