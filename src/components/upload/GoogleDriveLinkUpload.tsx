'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link2, FileText, Eye, Loader2, AlertTriangle, CheckCircle, HardDrive } from 'lucide-react';

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

export default function GoogleDriveLinkUpload() {
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

    setProcessing(true);
    setError('');
    setProcessedBook(null);

    try {
      const response = await fetch('/api/process-drive-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driveUrl: driveUrl.trim(),
          title: title.trim() || undefined,
          author: author.trim() || undefined,
          description: description.trim() || undefined,
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <Link2 className="h-16 w-16 mx-auto mb-4 text-blue-500" />
        <h2 className="text-2xl font-bold mb-4">Process Google Drive Links</h2>
        <p className="text-gray-600 mb-6">
          Sign in to process PDF files from Google Drive links<br />
          <span className="text-sm">• No file size limits</span><br />
          <span className="text-sm">• Instant processing</span><br />
          <span className="text-sm">• Works with shared files</span>
        </p>
        <Button onClick={() => signIn('google')} size="lg">
          Sign in with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <Link2 className="h-12 w-12 mx-auto mb-4 text-blue-500" />
        <h1 className="text-3xl font-bold mb-2">Process Google Drive Link</h1>
        <p className="text-gray-600">
          Add PDF files to your library by pasting Google Drive links
        </p>
      </div>

      {/* Link Processing Form */}
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
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste any Google Drive PDF link (shared files, your files, or public files)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                placeholder="Custom title for the book"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={processing}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="author">Author (optional)</Label>
              <Input
                id="author"
                placeholder="Author name"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                disabled={processing}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the book"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={processing}
              className="mt-1"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={processing || !driveUrl.trim()}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Link...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                Process Google Drive Link
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
                  {processedBook.isExisting ? 'File Already in Library' : 'File Processed Successfully'}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{processedBook.title}</span>
                  </div>
                  <div className="text-sm text-green-700">
                    <p>Author: {processedBook.author}</p>
                    <p>File: {processedBook.fileName}</p>
                    <p>Size: {formatFileSize(processedBook.fileSize)}</p>
                    <p>Added: {new Date(processedBook.uploadedAt).toLocaleDateString()}</p>
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
        <h3 className="font-medium text-blue-800 mb-2">How to use:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Copy any Google Drive PDF link and paste it above</li>
          <li>• Works with shared files, your files, or public files</li>
          <li>• The file will be added to your library instantly</li>
          <li>• You can read it in the PDF reader just like uploaded files</li>
          <li>• No file size limits - works with any size PDF</li>
        </ul>
      </div>
    </div>
  );
}
