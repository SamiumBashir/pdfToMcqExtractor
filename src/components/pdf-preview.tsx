"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  ExternalLink,
  Minimize2,
} from "lucide-react";

interface PdfPreviewProps {
  pdfFile: File | Blob | null;
  targetPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function PdfPreview({
  pdfFile,
  targetPage = 1,
  totalPages = 1,
  onPageChange,
}: PdfPreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(targetPage);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal page with targetPage from question clicks
  useEffect(() => {
    if (targetPage && targetPage !== currentPage) {
      setCurrentPage(targetPage);
    }
  }, [targetPage]);

  // Create and clean up Object URL
  useEffect(() => {
    if (!pdfFile) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(pdfFile);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pdfFile]);

  const handlePrevPage = () => {
    const next = Math.max(1, currentPage - 1);
    setCurrentPage(next);
    onPageChange?.(next);
  };

  const handleNextPage = () => {
    const next = Math.min(totalPages || 1, currentPage + 1);
    setCurrentPage(next);
    onPageChange?.(next);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(200, z + 15));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(60, z - 15));
  const handleResetZoom = () => setZoomLevel(100);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!objectUrl) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-center">
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
          <FileText className="w-8 h-8" />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          No PDF loaded for preview
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Upload a question paper to view side-by-side
        </p>
      </div>
    );
  }

  // Next.js / Browser PDF embed URL with page hash: #page=X&zoom=Y
  const previewSrc = `${objectUrl}#page=${currentPage}&zoom=${zoomLevel}`;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all ${
        isFullscreen ? "fixed inset-4 z-50 shadow-2xl" : "min-h-[550px]"
      }`}
    >
      {/* PDF Controls Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-xs">
        {/* Page navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= (totalPages || 1)}
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-1.5 py-0.5 rounded text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Reset Zoom"
          >
            {zoomLevel}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3.5 bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Open Original in New Tab */}
          <a
            href={objectUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Open original PDF in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* PDF Viewport */}
      <div className="flex-1 w-full bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
        <iframe
          src={previewSrc}
          title="PDF Document Preview"
          className="w-full h-full border-none"
        />
      </div>
    </div>
  );
}
