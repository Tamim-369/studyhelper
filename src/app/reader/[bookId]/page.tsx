'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SimplePDFViewer from '@/components/pdf/SimplePDFViewer';
import ScreenshotGuide from '@/components/pdf/ScreenshotGuide';
import { ExtractedText } from '@/lib/pdf/text-extraction';
import {
  ArrowLeft,
  BookOpen,
  Highlighter,
  MessageSquare,
  Settings,
  Maximize,
  Moon,
  Sun
} from 'lucide-react';
import Link from 'next/link';
import { Book } from '@/types';

// No mock data - fetch from API

export default function PDFReaderPage() {
  const params = useParams();
  const bookId = params.bookId as string;

  const [book, setBook] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<ExtractedText | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/books/${bookId}`);
        const data = await response.json();

        if (data.success) {
          setBook(data.data);
        } else {
          setError(data.error || 'Book not found');
        }
      } catch (err) {
        console.error('Error fetching book:', err);
        setError('Failed to load book');
      } finally {
        setIsLoading(false);
      }
    };

    if (bookId) {
      fetchBook();
    }
  }, [bookId]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleTextSelect = (extractedText: ExtractedText) => {
    console.log('Text selected:', extractedText);
    setExtractedText(extractedText);
    setCurrentPage(extractedText.pageNumber);
  };

  const handleClearSelection = () => {
    setExtractedText(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-medium">Loading book...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>{error ? 'Error Loading Book' : 'Book Not Found'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error || 'The requested book could not be found.'}
            </p>
            <Button asChild>
              <Link href="/library">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Library
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 border-r bg-card flex flex-col">
            {/* Book Info */}
            <div className="p-4 border-b">
              <Button variant="ghost" size="sm" asChild className="mb-3">
                <Link href="/library">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Library
                </Link>
              </Button>

              <h1 className="font-semibold text-lg line-clamp-2 mb-1">
                {book.title}
              </h1>
              <p className="text-sm text-muted-foreground mb-2">
                by {book.author}
              </p>

              <div className="flex flex-wrap gap-1 mb-3">
                {book.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="text-xs text-muted-foreground">
                Page {currentPage} of {book.totalPages}
              </div>
            </div>

            {/* Controls */}
            <div className="p-4 border-b space-y-4">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleDarkMode}
                  className="flex-1"
                >
                  {isDarkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {isDarkMode ? 'Light' : 'Dark'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleFullscreen}
                  className="flex-1"
                >
                  <Maximize className="h-4 w-4 mr-2" />
                  Fullscreen
                </Button>
              </div>
            </div>

            {/* Screenshot Guide */}
            <div className="p-4 border-b">
              <ScreenshotGuide />
            </div>

            {/* Highlights Panel */}
            <div className="flex-1 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Highlights</h3>
                <Badge variant="secondary">0</Badge>
              </div>

              <div className="text-center py-8">
                <Highlighter className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No highlights yet. Use AI Screenshot to select and explain any content.
                </p>
              </div>
            </div>


          </div>
        )}

        {/* Main PDF Viewer */}
        <div className="flex-1 flex flex-col">
          {/* Top Toolbar */}
          <div className="border-b bg-card p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <Settings className="h-4 w-4" />
              </Button>

              <div className="text-sm text-muted-foreground">
                {book.title}
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {book.totalPages}
            </div>
          </div>

          {/* PDF Content Area */}
          <div className="flex-1 overflow-hidden">
            <SimplePDFViewer
              fileUrl={`/api/books/drive-pdf/${bookId}`}
              title={book.title}
              bookId={bookId}
              onPageChange={handlePageChange}
              onTextSelect={handleTextSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
