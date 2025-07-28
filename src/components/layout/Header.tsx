'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
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
  const { data: session, status } = useSession();
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

          {/* Authentication Section */}
          {status === 'loading' ? (
            <div className="h-9 w-20 bg-gray-200 animate-pulse rounded"></div>
          ) : session ? (
            <div className="flex items-center space-x-3">
              {/* Upload button for authenticated users */}
              <Button asChild size="sm">
                <Link href="/upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF
                </Link>
              </Button>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                      <AvatarFallback>
                        {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user?.name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => signIn('google')}>
                Sign In
              </Button>
              <Button asChild size="sm">
                <Link href="/upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
