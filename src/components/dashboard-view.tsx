"use client";

import React from "react";
import {
  StructuredQuestion,
  DocumentRecord,
} from "@/types/question";
import { computeQuestionBankStats } from "@/lib/question-store";
import { exportToStandardCSV, downloadCsvFile } from "@/lib/csv-manager";
import { downloadBulkSvgZip } from "@/lib/svg/svg-generator";
import {
  FileText,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Layers,
  UploadCloud,
  Download,
  Sparkles,
  ArrowRight,
  Clock,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { useToast } from "./toast";

interface DashboardViewProps {
  questions: StructuredQuestion[];
  documents: DocumentRecord[];
  onNavigateTab: (tab: "dashboard" | "upload" | "bank" | "svg-studio") => void;
}

export function DashboardView({
  questions,
  documents,
  onNavigateTab,
}: DashboardViewProps) {
  const { showToast } = useToast();
  const stats = computeQuestionBankStats(questions, documents);

  const handleExportCsv = () => {
    if (questions.length === 0) {
      showToast("No Questions", "Upload a PDF or add questions first.", "info");
      return;
    }
    const csvContent = exportToStandardCSV(questions);
    downloadCsvFile(csvContent, "all-questions.csv");
    showToast("CSV Exported", `Exported ${questions.length} questions conforming to Section 46`, "success");
  };

  const handleExportSvgZip = async () => {
    if (questions.length === 0) {
      showToast("No Questions", "Upload a PDF or add questions first.", "info");
      return;
    }
    await downloadBulkSvgZip(questions);
    showToast("Bulk SVG Export", `Generated ZIP with ${questions.length} SVG files`, "success");
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            AI &amp; Rule-Based Question Extraction Platform
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Intelligent Question Bank Platform
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            Extract strictly pure questions, options, and answers from text and scanned PDFs.
            Ignore surrounding books, chapters, headers, and footers. Export ready-to-use vector SVG and standard CSV.
          </p>
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab("upload")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-md transition-all scale-100 hover:scale-[1.02]"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Question PDF
            </button>
            <button
              onClick={() => onNavigateTab("bank")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-md transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Browse Question Bank
            </button>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Statistics Grid conforming to Section 14 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total PDFs</span>
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {stats.totalPdfs}
          </div>
          <span className="text-[10px] text-slate-400">Documents processed</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Questions</span>
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {stats.totalQuestions}
          </div>
          <span className="text-[10px] text-slate-400">In Question Bank</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Approved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.approvedCount}
          </div>
          <span className="text-[10px] text-emerald-500/80">Exam &amp; Quiz ready</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Pending Review</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.pendingCount}
          </div>
          <span className="text-[10px] text-amber-500/80">Requires verification</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Low Confidence</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {stats.needsReviewCount}
          </div>
          <span className="text-[10px] text-rose-500/80">&lt; 70% confidence</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-violet-500 mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Categories</span>
            <Layers className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-violet-600 dark:text-violet-400">
            {Math.max(1, stats.categoriesCount)}
          </div>
          <span className="text-[10px] text-slate-400">Subject groups</span>
        </div>
      </div>

      {/* Main Two-Column Section: Recent Documents & Quick Exports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Documents Table (8 Cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Recent Question Documents
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Uploaded PDFs and their extraction statuses
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("upload")}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Upload PDF
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                No documents uploaded yet. Upload a question PDF to get started!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-2.5">Document</th>
                    <th className="pb-2.5">Pages</th>
                    <th className="pb-2.5">Questions</th>
                    <th className="pb-2.5">Type</th>
                    <th className="pb-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {documents.slice(0, 5).map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200 max-w-[180px] truncate">
                        {doc.fileName}
                      </td>
                      <td className="py-3 text-slate-500">{doc.pageCount}</td>
                      <td className="py-3 font-bold text-blue-600 dark:text-blue-400">
                        {doc.questionCount}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {doc.pdfType.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ready
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Export & Actions Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Export Question Bank
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Export questions for online exams, quiz systems, or programmatic vector graphics.
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleExportCsv}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div>Standard CSV Export</div>
                    <span className="text-[10px] font-normal text-slate-400">Section 46 format</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={handleExportSvgZip}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div>Bulk Vector SVG (ZIP)</div>
                    <span className="text-[10px] font-normal text-slate-400">Section 22 bundle</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
