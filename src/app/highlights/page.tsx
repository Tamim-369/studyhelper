'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Highlighter, BookOpen, Search, Calendar, MessageSquare } from 'lucide-react';

// Mock highlights data
const mockHighlights = [
  {
    id: '1',
    bookTitle: 'The Art of Computer Programming',
    bookAuthor: 'Donald E. Knuth',
    pageNumber: 42,
    selectedText: 'An algorithm must be seen to be believed, and the best way to learn what an algorithm is all about is to try it.',
    note: 'Key insight about understanding algorithms',
    color: '#ffeb3b',
    createdAt: new Date('2024-01-20'),
    aiExplanation: 'This quote emphasizes the practical nature of algorithm learning. Knuth suggests that theoretical understanding alone is insufficient...',
  },
  {
    id: '2',
    bookTitle: 'Clean Code',
    bookAuthor: 'Robert C. Martin',
    pageNumber: 15,
    selectedText: 'Clean code is simple and direct. Clean code reads like well-written prose.',
    note: 'Definition of clean code',
    color: '#4caf50',
    createdAt: new Date('2024-01-18'),
    aiExplanation: 'Martin compares clean code to well-written prose to emphasize readability and clarity...',
  },
  {
    id: '3',
    bookTitle: 'Introduction to Machine Learning',
    bookAuthor: 'Ethem Alpaydin',
    pageNumber: 78,
    selectedText: 'Machine learning is programming computers to optimize a performance criterion using example data or past experience.',
    note: 'Core definition of ML',
    color: '#2196f3',
    createdAt: new Date('2024-01-15'),
    aiExplanation: 'This definition captures the essence of machine learning as an optimization problem...',
  },
];

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState(mockHighlights);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredHighlights = highlights.filter(highlight =>
    highlight.selectedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    highlight.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    highlight.note?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Highlights
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review your highlighted text and AI explanations
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search highlights, books, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Highlighter className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{highlights.length}</p>
                  <p className="text-sm text-muted-foreground">Total Highlights</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-sm text-muted-foreground">Books Highlighted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{highlights.length}</p>
                  <p className="text-sm text-muted-foreground">AI Explanations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Highlights List */}
        {filteredHighlights.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Highlighter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No highlights found' : 'No highlights yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Start reading books and highlight important sections to see them here'
                }
              </p>
              {!searchQuery && (
                <Button asChild>
                  <a href="/library">Browse Library</a>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredHighlights.map((highlight) => (
              <Card key={highlight.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{highlight.bookTitle}</CardTitle>
                      <CardDescription>
                        by {highlight.bookAuthor} • Page {highlight.pageNumber}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: highlight.color }}
                      />
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(highlight.createdAt)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Highlighted Text */}
                  <div className="p-3 rounded-lg border-l-4 bg-muted/50" 
                       style={{ borderLeftColor: highlight.color }}>
                    <p className="text-sm italic">"{highlight.selectedText}"</p>
                  </div>

                  {/* User Note */}
                  {highlight.note && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Your Note:</h4>
                      <p className="text-sm text-muted-foreground">{highlight.note}</p>
                    </div>
                  )}

                  {/* AI Explanation */}
                  {highlight.aiExplanation && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        AI Explanation:
                      </h4>
                      <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                        {highlight.aiExplanation}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/reader/${highlight.id}?page=${highlight.pageNumber}`}>
                        View in Book
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm">
                      Ask Follow-up
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results count */}
        {searchQuery && (
          <p className="text-sm text-muted-foreground text-center">
            {filteredHighlights.length} highlight{filteredHighlights.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>
    </MainLayout>
  );
}
