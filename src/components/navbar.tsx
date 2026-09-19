"use client";

import React from "react";
import { ThemeToggle } from "./theme-toggle";
import { Sparkles, FileText, RefreshCw } from "lucide-react";

interface NavbarProps {
  hasExtractedData?: boolean;
  onReset?: () => void;
}

export function Navbar({ hasExtractedData, onReset }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                PDF MCQ Extractor
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Intelligent MCQ Extraction • English & বাংলা • OCR & AI Support
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {hasExtractedData && onReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Another PDF</span>
              <span className="sm:hidden">New PDF</span>
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
