"use client";

import React, { useState, useRef, useEffect } from "react";
import { MCQQuestion } from "@/types/question";
import {
  Download,
  Copy,
  FileCode,
  FileSpreadsheet,
  FileText,
  File,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  formatAllQuestionsText,
  exportToJSON,
  exportToCSV,
  exportToExcel,
  exportToWord,
} from "@/lib/export";
import { useToast } from "./toast";
import confetti from "canvas-confetti";

interface ExportMenuProps {
  questions: MCQQuestion[];
  filename?: string;
}

export function ExportMenu({ questions, filename = "mcq-bank" }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const baseName = filename.replace(/\.[^/.]+$/, "");

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const triggerDownload = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Subtle celebratory confetti
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.85 },
      colors: ["#3B82F6", "#10B981", "#6366F1"],
    });
  };

  const handleCopyAll = () => {
    const text = formatAllQuestionsText(questions);
    navigator.clipboard.writeText(text);
    showToast("Copied All Questions!", `${questions.length} questions copied to clipboard`, "success");
    setIsOpen(false);
  };

  const handleDownloadTxt = () => {
    const text = formatAllQuestionsText(questions);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    triggerDownload(blob, "txt");
    showToast("Downloaded TXT File", `${questions.length} questions saved`, "success");
    setIsOpen(false);
  };

  const handleDownloadJSON = () => {
    const jsonStr = exportToJSON(questions);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    triggerDownload(blob, "json");
    showToast("Downloaded JSON File", "Structured JSON format", "success");
    setIsOpen(false);
  };

  const handleDownloadCSV = () => {
    const csvStr = exportToCSV(questions);
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8" });
    triggerDownload(blob, "csv");
    showToast("Downloaded CSV File", "Ready for Excel & Google Sheets", "success");
    setIsOpen(false);
  };

  const handleDownloadExcel = () => {
    try {
      const buffer = exportToExcel(questions);
      const blob = new Blob([buffer as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      triggerDownload(blob, "xlsx");
      showToast("Downloaded Excel (.xlsx)", "Formatted spreadsheet with columns", "success");
    } catch (err) {
      showToast("Failed to generate Excel file", String(err), "error");
    }
    setIsOpen(false);
  };

  const handleDownloadWord = async () => {
    try {
      setIsExporting(true);
      const blob = await exportToWord(questions);
      triggerDownload(blob, "docx");
      showToast("Downloaded Word Document (.docx)", "Styled examination format", "success");
    } catch (err) {
      showToast("Failed to generate Word document", String(err), "error");
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={questions.length === 0 || isExporting}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>Export Question Bank</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-80" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-30 py-2 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in-50 zoom-in-95">
          {/* Quick Copy */}
          <div className="py-1">
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Copy className="w-4 h-4 text-blue-500" />
              <div className="text-left">
                <div className="font-semibold">Copy All to Clipboard</div>
                <div className="text-[10px] text-slate-400">Plain text formatted</div>
              </div>
            </button>
          </div>

          {/* Formats */}
          <div className="py-1">
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-3 w-full px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <div className="text-left">
                <div className="font-semibold">Excel Spreadsheet (.xlsx)</div>
                <div className="text-[10px] text-slate-400">Columns with options</div>
              </div>
            </button>

            <button
              onClick={handleDownloadWord}
              disabled={isExporting}
              className="flex items-center gap-3 w-full px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <div className="text-left">
                <div className="font-semibold">Word Document (.docx)</div>
                <div className="text-[10px] text-slate-400">Formatted question sheet</div>
              </div>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-3 w-full px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <File className="w-4 h-4 text-emerald-600" />
              <div className="text-left">
                <div className="font-semibold">Standard CSV (.csv)</div>
                <div className="text-[10px] text-slate-400">Section 46 format (UTF-8 BOM)</div>
              </div>
            </button>

            <button
              onClick={async () => {
                setIsOpen(false);
                try {
                  const { downloadBulkSvgZip } = await import("@/lib/svg/svg-generator");
                  await downloadBulkSvgZip(questions);
                  showToast("Bulk SVG Export", `Downloaded ${questions.length} SVG files in ZIP bundle`, "success");
                } catch (e) {
                  showToast("SVG Export Error", String(e), "error");
                }
              }}
              className="flex items-center gap-3 w-full px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FileCode className="w-4 h-4 text-amber-500" />
              <div className="text-left">
                <div className="font-semibold">Vector SVG Bundle (.zip)</div>
                <div className="text-[10px] text-slate-400">Pure vector semantic SVG cards</div>
              </div>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-3 w-full px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FileCode className="w-4 h-4 text-purple-600" />
              <div className="text-left">
                <div className="font-semibold">JSON Format (.json)</div>
                <div className="text-[10px] text-slate-400">Structured API schema</div>
              </div>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="flex items-center gap-3 w-full px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <div className="text-left">
                <div className="font-semibold">Plain Text (.txt)</div>
                <div className="text-[10px] text-slate-400">Clean formatted text</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
