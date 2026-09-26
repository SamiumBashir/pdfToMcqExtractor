"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { PdfUploader } from "@/components/pdf-uploader";
import { ExtractionProgressView } from "@/components/extraction-progress";
import { StatsCard } from "@/components/stats-card";
import { QuestionCard } from "@/components/question-card";
import { QuestionEditor } from "@/components/question-editor";
import { SearchBar, FilterOption } from "@/components/search-bar";
import { ExportMenu } from "@/components/export-menu";
import { PdfPreview } from "@/components/pdf-preview";
import { useToast } from "@/components/toast";
import {
  MCQQuestion,
  ExtractionStats,
  ExtractionProgress,
} from "@/types/question";
import { extractTextFromPDFClient } from "@/lib/client-pdf-parser";
import { parseMCQDocument } from "@/lib/question-parser";
import {
  Sparkles,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  Layers,
  CheckCircle,
  Cpu,
  BookOpen,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import confetti from "canvas-confetti";

const STORAGE_KEY = "pdf-mcq-saved-session";

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | Blob | null>(null);
  const [filename, setFilename] = useState<string>("exam-questions.pdf");
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [stats, setStats] = useState<ExtractionStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress>({
    step: "idle",
    message: "",
    percent: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Split-screen & Selection state
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null
  );
  const [activePdfPage, setActivePdfPage] = useState<number>(1);
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(true);

  // Editor Modal
  const [editingQuestion, setEditingQuestion] = useState<MCQQuestion | null>(
    null
  );

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");

  const { showToast } = useToast();

  // Load saved session from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.questions && parsed.questions.length > 0) {
          setQuestions(parsed.questions);
          setStats(parsed.stats || null);
          setFilename(parsed.filename || "saved-mcq.pdf");
        }
      }
    } catch (e) {
      console.warn("Failed to load saved session:", e);
    }
  }, []);

  // Save changes to localStorage
  const persistSession = (
    updatedQuestions: MCQQuestion[],
    updatedStats: ExtractionStats | null,
    currentFilename: string
  ) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          questions: updatedQuestions,
          stats: updatedStats,
          filename: currentFilename,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.warn("Failed to cache session:", e);
    }
  };

  const handleStartExtraction = async (
    file: File | Blob,
    name: string,
    options: { useAi: boolean; apiKey?: string; useOcr: string }
  ) => {
    setIsProcessing(true);
    setError(null);
    setPdfFile(file);
    setFilename(name);

    setProgress({
      step: "uploading",
      message: "Analyzing document...",
      percent: 15,
    });

    try {
      let extractedQuestions: MCQQuestion[] = [];
      let computedStats: ExtractionStats = {
        totalQuestions: 0,
        answeredCount: 0,
        unansweredCount: 0,
        needsReviewCount: 0,
        totalPages: 1,
        isOcrUsed: false,
      };

      // Client-side extraction directly in the browser handles files up to 150MB
      // without server upload limits (eliminates 413 Request Entity Too Large).
      setProgress({
        step: "extracting",
        message: "Reading PDF pages in browser...",
        percent: 25,
      });

      const arrayBuffer = await file.arrayBuffer();
      const clientRes = await extractTextFromPDFClient(arrayBuffer, (curr, total) => {
        setProgress({
          step: "extracting",
          message: `Extracting text: page ${curr} of ${total}...`,
          percent: Math.min(80, Math.round(25 + (curr / total) * 55)),
        });
      });

      if (!clientRes.success) {
        throw new Error(clientRes.error || "Failed to extract text from PDF.");
      }

      // If AI extraction is requested, send lightweight JSON text to /api/extract
      if (options.useAi && (options.apiKey || process.env.NEXT_PUBLIC_HAS_AI)) {
        setProgress({
          step: "detecting_answers",
          message: "Enhancing extraction with AI model...",
          percent: 85,
        });

        try {
          const aiRes = await fetch("/api/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullText: clientRes.fullText,
              pages: clientRes.pages,
              totalPages: clientRes.totalPages,
              useAi: true,
              apiKey: options.apiKey,
            }),
          });

          const contentType = aiRes.headers.get("content-type") || "";
          if (aiRes.ok && contentType.includes("application/json")) {
            const aiData = await aiRes.json();
            if (aiData.success && aiData.questions?.length > 0) {
              extractedQuestions = aiData.questions;
              computedStats = aiData.stats;
            }
          } else {
            console.warn("AI extraction route returned non-200 or non-JSON, falling back to local engine");
          }
        } catch (aiErr) {
          console.warn("AI extraction error, falling back to local parser:", aiErr);
        }
      }

      // Fallback or default deterministic MCQ parser
      if (extractedQuestions.length === 0) {
        setProgress({
          step: "detecting_questions",
          message: "Parsing questions, options, and answer keys...",
          percent: 90,
        });

        extractedQuestions = parseMCQDocument(clientRes.pages, clientRes.fullText);
        computedStats = {
          totalQuestions: extractedQuestions.length,
          answeredCount: extractedQuestions.filter((q) => q.status === "answered").length,
          unansweredCount: extractedQuestions.filter((q) => q.status === "missing_answer").length,
          needsReviewCount: extractedQuestions.filter((q) => q.confidence === "needs-review").length,
          totalPages: clientRes.totalPages,
          isOcrUsed: clientRes.isScanned,
        };
      }

      setProgress({
        step: "completed",
        message: "MCQ extraction completed successfully!",
        percent: 100,
      });

      setQuestions(extractedQuestions);
      setStats(computedStats);
      persistSession(extractedQuestions, computedStats, name);

      if (extractedQuestions.length > 0) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
        showToast(
          "Extraction Complete!",
          `Extracted ${extractedQuestions.length} questions successfully`,
          "success"
        );
      } else {
        showToast(
          "No Questions Detected",
          "Try enabling OCR or review document format",
          "info"
        );
      }
    } catch (err: unknown) {
      console.error("Extraction failed:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to process PDF document.";
      setError(msg);
      setProgress({
        step: "error",
        message: msg,
        percent: 0,
      });
      showToast("Extraction Error", msg, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (
    file: File,
    options: { useAi: boolean; apiKey?: string; useOcr: string }
  ) => {
    handleStartExtraction(file, file.name, options);
  };

  const handleSampleSelect = (
    sampleBlob: Blob,
    sampleFilename: string,
    options: { useAi: boolean; apiKey?: string; useOcr: string }
  ) => {
    handleStartExtraction(sampleBlob, sampleFilename, options);
  };

  const handleSaveQuestion = (updated: MCQQuestion) => {
    const nextQuestions = questions.map((q) =>
      q.id === updated.id ? updated : q
    );
    setQuestions(nextQuestions);

    // Recalculate stats
    const updatedStats: ExtractionStats = {
      totalQuestions: nextQuestions.length,
      answeredCount: nextQuestions.filter((q) => q.status === "answered").length,
      unansweredCount: nextQuestions.filter((q) => q.status === "missing_answer").length,
      needsReviewCount: nextQuestions.filter((q) => q.confidence === "needs-review").length,
      totalPages: stats?.totalPages || 1,
      isOcrUsed: stats?.isOcrUsed || false,
    };
    setStats(updatedStats);
    persistSession(nextQuestions, updatedStats, filename);
    showToast("Changes Saved", `Question ${updated.number} updated`, "success");
  };

  const handleDeleteQuestion = (id: string) => {
    const nextQuestions = questions.filter((q) => q.id !== id);
    setQuestions(nextQuestions);

    const updatedStats: ExtractionStats = {
      totalQuestions: nextQuestions.length,
      answeredCount: nextQuestions.filter((q) => q.status === "answered").length,
      unansweredCount: nextQuestions.filter((q) => q.status === "missing_answer").length,
      needsReviewCount: nextQuestions.filter((q) => q.confidence === "needs-review").length,
      totalPages: stats?.totalPages || 1,
      isOcrUsed: stats?.isOcrUsed || false,
    };
    setStats(updatedStats);
    persistSession(nextQuestions, updatedStats, filename);
    showToast("Question Deleted", undefined, "info");
  };

  const handleSelectQuestion = (q: MCQQuestion) => {
    setSelectedQuestionId(q.id);
    if (q.pageNumber) {
      setActivePdfPage(q.pageNumber);
    }
  };

  const handleResetSession = () => {
    if (confirm("Reset current extraction and upload a new PDF?")) {
      setQuestions([]);
      setStats(null);
      setPdfFile(null);
      setSelectedQuestionId(null);
      setError(null);
      localStorage.removeItem(STORAGE_KEY);
      showToast("Session Reset", "Ready to upload another document", "info");
    }
  };

  // Filter & Search calculations
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // 1. Status Filter
      if (activeFilter === "answered" && q.status !== "answered") return false;
      if (activeFilter === "missing_answer" && q.status !== "missing_answer")
        return false;
      if (activeFilter === "needs_review" && q.confidence !== "needs-review")
        return false;
      if (activeFilter === "high_confidence" && q.confidence !== "high")
        return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesNum = String(q.number).includes(query);
        const matchesQuestion = q.question.toLowerCase().includes(query);
        const matchesOptions = Object.values(q.options || {}).some((opt) =>
          opt.toLowerCase().includes(query)
        );
        return matchesNum || matchesQuestion || matchesOptions;
      }

      return true;
    });
  }, [questions, activeFilter, searchQuery]);

  const filterCounts = useMemo(() => {
    return {
      all: questions.length,
      answered: questions.filter((q) => q.status === "answered").length,
      missing_answer: questions.filter((q) => q.status === "missing_answer").length,
      needs_review: questions.filter((q) => q.confidence === "needs-review").length,
      high_confidence: questions.filter((q) => q.confidence === "high").length,
    };
  }, [questions]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar
        hasExtractedData={questions.length > 0}
        onReset={handleResetSession}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* VIEW 1: UPLOAD STATE */}
        {!isProcessing && questions.length === 0 && (
          <div className="py-6 sm:py-12 space-y-12">
            {/* Hero Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Examination Paper Parser</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                Extract Multiple Choice Questions from{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Any PDF
                </span>
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Automatic question, option, and answer detection for English & Bengali (বাংলা)
                exams. Works on native and scanned PDFs with OCR and instant export to Excel,
                Word, CSV, and JSON.
              </p>
            </div>

            {/* Uploader Card */}
            <PdfUploader
              onFileSelect={handleFileSelect}
              onSampleSelect={handleSampleSelect}
              isLoading={isProcessing}
            />

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-2xs">
                <div className="p-2 w-fit rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-2">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Zero Hallucinations
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Never invents missing answers. Clearly flags unverified questions as "Needs Review".
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-2xs">
                <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Native Bengali Support
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Recognizes ১, ২, ৩, ক, খ, গ, ঘ, উত্তরমালা, and BCS/HSC exam formats natively.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-2xs">
                <div className="p-2 w-fit rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-2">
                  <Cpu className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Tesseract.js OCR
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Scanned pages and photocopied question papers are recognized automatically.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-2xs">
                <div className="p-2 w-fit rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Full Suite Export
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Download formatted Word (.docx), Excel (.xlsx), CSV with UTF-8 BOM, or JSON.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: PROCESSING SCREEN */}
        {isProcessing && (
          <div className="py-16 sm:py-24">
            <ExtractionProgressView
              progress={progress}
              totalExtracted={questions.length}
            />
          </div>
        )}

        {/* VIEW 3: RESULTS DASHBOARD (SPLIT SCREEN) */}
        {!isProcessing && questions.length > 0 && (
          <div className="space-y-6">
            {/* Top Row: Metric Stats + Export & Control Buttons */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {stats && <StatsCard stats={stats} />}
            </div>

            {/* Dashboard Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">
                  {filename}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                  {questions.length} Questions
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Toggle PDF preview panel */}
                <button
                  type="button"
                  onClick={() => setShowPdfPreview(!showPdfPreview)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  title={showPdfPreview ? "Hide PDF split view" : "Show PDF split view"}
                >
                  {showPdfPreview ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Hide PDF Preview</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Show PDF Preview</span>
                    </>
                  )}
                </button>

                {/* Export Dropdown */}
                <ExportMenu questions={questions} filename={filename} />

                {/* Reset button */}
                <button
                  type="button"
                  onClick={handleResetSession}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Upload Another PDF"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Split-Screen Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: PDF PREVIEW */}
              {showPdfPreview && (
                <div className="lg:col-span-5 h-[650px] lg:sticky lg:top-20">
                  <PdfPreview
                    pdfFile={pdfFile}
                    targetPage={activePdfPage}
                    totalPages={stats?.totalPages || 1}
                    onPageChange={(p) => setActivePdfPage(p)}
                  />
                </div>
              )}

              {/* RIGHT COLUMN: EXTRACTED QUESTIONS LIST */}
              <div
                className={`${
                  showPdfPreview ? "lg:col-span-7" : "lg:col-span-12"
                } space-y-4`}
              >
                {/* Search & Filter Component */}
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                  counts={filterCounts}
                />

                {/* Question Cards List */}
                {filteredQuestions.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                      No matching questions found
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Try adjusting your search query or switching the active filter.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {filteredQuestions.map((q) => (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        isSelected={selectedQuestionId === q.id}
                        onSelect={handleSelectQuestion}
                        onEdit={(target) => setEditingQuestion(target)}
                        onDelete={handleDeleteQuestion}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Question Editor Modal */}
      {editingQuestion && (
        <QuestionEditor
          question={editingQuestion}
          isOpen={true}
          onSave={handleSaveQuestion}
          onClose={() => setEditingQuestion(null)}
        />
      )}
    </div>
  );
}
