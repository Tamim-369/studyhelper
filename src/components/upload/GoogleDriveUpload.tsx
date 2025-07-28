'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, LogOut, User, FileText, Download, Eye, Loader2, RefreshCw } from 'lucide-react';

interface UploadedBook {
    _id: string;
    title: string;
    fileName: string;
    fileSize: number;
    downloadLink: string;
    viewLink: string;
    directLink: string;
    uploadedAt: string;
    storageType: string;
}

export default function GoogleDriveUpload() {
    const { data: session, status } = useSession();
    const [uploading, setUploading] = useState(false);
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

    const handleUpload = async (file: File) => {
        if (!session) {
            signIn('google');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            console.log('🚀 Starting upload:', file.name);

            const response = await fetch('/api/upload-to-drive', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const result = await response.json();
            console.log('✅ Upload successful:', result);

            // Add to uploaded books list
            setUploadedBooks(prev => [result.book, ...prev]);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Show success message
            alert('File uploaded successfully to Google Drive!');

        } catch (error: any) {
            console.error('❌ Upload error:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(file);
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading...</span>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="text-center p-8 max-w-md mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="mb-6">
                        <Upload className="h-16 w-16 mx-auto text-blue-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Sign in to Upload PDFs</h2>
                        <p className="text-gray-600">
                            Connect your Google account to upload PDFs to your Google Drive and access them from anywhere
                        </p>
                    </div>
                    <Button
                        onClick={() => signIn('google')}
                        className="flex items-center gap-2 w-full"
                        size="lg"
                    >
                        <User className="h-5 w-5" />
                        Sign in with Google
                    </Button>
                    <p className="text-xs text-gray-500 mt-4">
                        Your files will be stored in your personal Google Drive
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* User Info Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img
                            src={session.user?.image || ''}
                            alt="Profile"
                            className="w-12 h-12 rounded-full border-2 border-gray-200"
                        />
                        <div>
                            <h2 className="text-xl font-semibold">{session.user?.name}</h2>
                            <p className="text-gray-600">{session.user?.email}</p>
                            <p className="text-sm text-green-600">✅ Connected to Google Drive</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => signOut()}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-sm border p-8 mb-6">
                <div className="text-center">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors">
                        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Upload PDF to Google Drive</h3>
                        <p className="text-gray-600 mb-6">
                            Select a PDF file to upload to your Google Drive (up to 500MB)
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileSelect}
                            disabled={uploading}
                            className="hidden"
                        />

                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            size="lg"
                            className="mb-4"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Choose PDF File
                                </>
                            )}
                        </Button>

                        {uploading && (
                            <div className="mt-4">
                                <div className="bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
                                    <div className="bg-blue-600 h-2 rounded-full animate-pulse w-full" />
                                </div>
                                <p className="text-sm text-gray-600 mt-2">Uploading to Google Drive...</p>
                            </div>
                        )}
                    </div>
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
                                <div key={book._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                            <FileText className="h-6 w-6 text-red-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">{book.title}</h4>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span>{formatFileSize(book.fileSize)}</span>
                                                <span>•</span>
                                                <span>{new Date(book.uploadedAt).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span className="text-green-600">Google Drive</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(book.directLink, '_blank')}
                                            title="View in Google Drive"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(book.downloadLink, '_blank')}
                                            title="Download PDF"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => window.open(`/reader/${book._id}`, '_blank')}
                                            title="Open in StudyHelper"
                                        >
                                            Open
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Info Section */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📁 About Google Drive Storage</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Files are stored in your personal Google Drive account</li>
                    <li>• You get 15GB of free storage with your Google account</li>
                    <li>• Files can be accessed from any device where you're signed in</li>
                    <li>• You maintain full control over your uploaded files</li>
                </ul>
            </div>
        </div>
    );
}