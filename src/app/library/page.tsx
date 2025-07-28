'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import BookGrid from '@/components/books/BookGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, BookOpen, Plus } from 'lucide-react';
import { Book } from '@/types';

// No user authentication needed

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch books from API
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/books');
        const data = await response.json();

        if (data.success) {
          setBooks(data.data.books || []);
        } else {
          setError(data.error || 'Failed to fetch books');
        }
      } catch (err) {
        console.error('Error fetching books:', err);
        setError('Failed to connect to the database');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleEditBook = (book: Book) => {
    console.log('Edit book:', book);
    // TODO: Implement edit functionality
  };

  const handleDeleteBook = (book: Book) => {
    console.log('Delete book:', book);
    // TODO: Implement delete functionality
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Library
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Discover and read PDF books with AI-powered explanations
            </p>
          </div>

          <Button asChild>
            <a href="/upload">
              <Plus className="h-4 w-4 mr-2" />
              Upload PDF
            </a>
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20">
            <Card className="w-full max-w-md text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle>Database Connection Error</CardTitle>
                <CardDescription>
                  {error}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => window.location.reload()} className="w-full">
                  Try Again
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Make sure MongoDB is running and properly configured.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Card className="w-full max-w-md text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>No Books Yet</CardTitle>
                <CardDescription>
                  Your library is empty. Start by uploading your first PDF book.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <a href="/upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First PDF
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Books Grid */}
        {!error && (books.length > 0 || isLoading) && (
          <BookGrid
            books={books}
            onEdit={handleEditBook}
            onDelete={handleDeleteBook}
            showActions={true}
            isLoading={isLoading}
          />
        )}
      </div>
    </MainLayout>
  );
}
