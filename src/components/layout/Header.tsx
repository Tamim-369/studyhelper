'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BookOpen,
  Menu,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  Upload
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function Header({
  onToggleSidebar,
  isDarkMode = false,
  onToggleDarkMode
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6" />
          <span className="hidden font-bold sm:inline-block">
            StudyHelper
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-6 text-sm font-medium ml-6">
          <Link
            href="/library"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Library
          </Link>
          <Link
            href="/upload"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Upload PDF
          </Link>
          <Link
            href="/highlights"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            My Highlights
          </Link>
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleDarkMode}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Upload button */}
          <Button asChild size="sm">
            <Link href="/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
