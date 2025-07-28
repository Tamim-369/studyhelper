import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Highlighter, Brain, Upload, Users, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">StudyHelper</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button asChild>
              <Link href="/library">Browse Library</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/upload">Upload PDF</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            AI-Powered PDF Reading
            <span className="text-blue-600 block">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Upload any PDF, highlight important sections, and get instant AI explanations.
            No sign-up required - start reading and learning immediately.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/library">
                <BookOpen className="h-5 w-5 mr-2" />
                Browse Library
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/upload">
                <Upload className="h-5 w-5 mr-2" />
                Upload PDF
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Powerful Features for Better Learning
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Everything you need to enhance your reading and comprehension experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Smart PDF Reader</CardTitle>
              <CardDescription>
                Clean, minimal interface optimized for reading with smooth scrolling,
                page jumping, and dark/light mode support.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
                <Highlighter className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle>Intelligent Highlighting</CardTitle>
              <CardDescription>
                Highlight any section and get instant AI explanations using context
                from surrounding pages for better understanding.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>AI-Powered Explanations</CardTitle>
              <CardDescription>
                Ask follow-up questions about highlighted content and get detailed
                answers powered by advanced AI models.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Easy PDF Management</CardTitle>
              <CardDescription>
                Upload and organize your PDF library with metadata, tags, and
                thumbnail previews for quick access.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Personal Library</CardTitle>
              <CardDescription>
                Keep track of your highlights, notes, and reading history across
                all your books in one organized place.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle>Fast & Responsive</CardTitle>
              <CardDescription>
                Built with modern web technologies for lightning-fast performance
                and seamless user experience across all devices.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-blue-600 dark:bg-blue-700 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Reading?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start reading and learning with AI-powered explanations today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/library">
                Browse Library
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/upload">
                Upload Your PDF
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900 dark:text-white">StudyHelper</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2024 StudyHelper. Built with Next.js and AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
