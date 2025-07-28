'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UploadPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <BookOpen className="h-16 w-16 mx-auto mb-6 text-blue-500" />
          <h1 className="text-3xl font-bold mb-4">Welcome to StudyHelper</h1>
          <p className="text-lg text-gray-600 mb-8">
            Browse our collection of books and start reading instantly.
            No uploads needed - just click and read!
          </p>

          <div className="space-y-4">
            <Button
              size="lg"
              onClick={() => router.push('/library')}
              className="w-full max-w-sm"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Browse Library
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>

            <p className="text-sm text-gray-500">
              All books are ready to read - no sign-in required
            </p>
          </div>

          <div className="mt-12 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Browse the library to find books</li>
              <li>• Click on any book to start reading</li>
              <li>• Use AI features to get explanations and summaries</li>
              <li>• Take screenshots and extract text from any page</li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
