import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppStore, User, Book, Highlight, PDFViewerState } from "@/types";

const initialPDFViewerState: PDFViewerState = {
  currentPage: 1,
  totalPages: 0,
  scale: 1.0,
  isDarkMode: false,
  isFullscreen: false,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // User state (simplified - no authentication)
      user: null,
      setUser: (user) => set({ user }),

      // Current book state
      currentBook: null,
      setCurrentBook: (book) => set({ currentBook: book }),

      // PDF viewer state
      pdfViewerState: initialPDFViewerState,
      setPdfViewerState: (state) =>
        set((prev) => ({
          pdfViewerState: { ...prev.pdfViewerState, ...state },
        })),

      // Highlights state
      highlights: [],
      setHighlights: (highlights) => set({ highlights }),
      addHighlight: (highlight) =>
        set((state) => ({
          highlights: [...state.highlights, highlight],
        })),
      removeHighlight: (highlightId) =>
        set((state) => ({
          highlights: state.highlights.filter(
            (h) => h._id.toString() !== highlightId
          ),
        })),

      // UI state
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Loading states
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: "studyhelper-storage",
      partialize: (state) => ({
        user: state.user,
        pdfViewerState: {
          ...state.pdfViewerState,
          currentPage: 1, // Reset page on reload
        },
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

// Selectors for better performance
export const useUser = () => useAppStore((state) => state.user);
export const useCurrentBook = () => useAppStore((state) => state.currentBook);
export const usePDFViewerState = () =>
  useAppStore((state) => state.pdfViewerState);
export const useHighlights = () => useAppStore((state) => state.highlights);
export const useSidebarOpen = () => useAppStore((state) => state.sidebarOpen);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
