import { ObjectId } from "mongoose";

// User Types
export interface User {
  _id: ObjectId;
  email: string;
  name: string;
  role: "admin" | "user";
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Book Types
export interface Book {
  _id: ObjectId;
  title: string;
  author: string;
  description?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  totalPages: number;
  uploadedBy: string;
  uploadedAt: Date;
  isPublic: boolean;
  tags: string[];
  thumbnail?: string;
}

// Highlight Types
export interface Highlight {
  _id: ObjectId;
  bookId: ObjectId;
  userId: string;
  pageNumber: number;
  selectedText: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  color: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

// AI Conversation Types
export interface AIExplanation {
  _id: ObjectId;
  highlightId: ObjectId;
  userId: string;
  bookId: ObjectId;
  contextText: string; // Text from current page + 2 pages before/after
  explanation: string;
  createdAt: Date;
}

export interface AIQuestion {
  _id: ObjectId;
  explanationId: ObjectId;
  userId: string;
  question: string;
  answer: string;
  createdAt: Date;
}

// PDF Reader Types
export interface PDFViewerState {
  currentPage: number;
  totalPages: number;
  scale: number;
  isDarkMode: boolean;
  isFullscreen: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Groq API Types
export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Component Props Types
export interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
}

export interface HighlightCardProps {
  highlight: Highlight;
  book: Book;
  onSelect: (highlight: Highlight) => void;
}

export interface PDFReaderProps {
  book: Book;
  onHighlight: (
    highlight: Omit<Highlight, "_id" | "createdAt" | "updatedAt">
  ) => void;
}

// Store Types (for Zustand)
export interface AppStore {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;

  // Current book state
  currentBook: Book | null;
  setCurrentBook: (book: Book | null) => void;

  // PDF viewer state
  pdfViewerState: PDFViewerState;
  setPdfViewerState: (state: Partial<PDFViewerState>) => void;

  // Highlights state
  highlights: Highlight[];
  setHighlights: (highlights: Highlight[]) => void;
  addHighlight: (highlight: Highlight) => void;
  removeHighlight: (highlightId: string) => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}
