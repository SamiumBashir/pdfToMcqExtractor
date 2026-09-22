"use client";

import React, { useState, useRef, DragEvent } from "react";
import {
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  Sparkles,
  Cpu,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { SAMPLE_DATASETS } from "@/lib/samples";

interface PdfUploaderProps {
  onFileSelect: (
    file: File,
    options: { useAi: boolean; apiKey?: string; useOcr: string }
  ) => void;
  onSampleSelect: (
    sampleBlob: Blob,
    filename: string,
    options: { useAi: boolean; apiKey?: string; useOcr: string }
  ) => void;
  isLoading: boolean;
}

export function PdfUploader({
  onFileSelect,
  onSampleSelect,
  isLoading,
}: PdfUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Advanced options
  const [useAi, setUseAi] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [useOcr, setUseOcr] = useState<"auto" | "force" | "none">("auto");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setError(null);

    // Validate type
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Invalid file type. Please upload a valid PDF document (.pdf).");
      return false;
    }

    // Validate size (150MB max)
    if (file.size > 150 * 1024 * 1024) {
      setError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 150MB.`
      );
      return false;
    }

    // Validate empty file
    if (file.size === 0) {
      setError("The uploaded PDF file is empty (0 bytes).");
      return false;
    }

    setSelectedFile(file);
    return true;
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleStartExtraction = () => {
    if (!selectedFile) return;
    onFileSelect(selectedFile, {
      useAi,
      apiKey: apiKey.trim() || undefined,
      useOcr,
    });
  };

  const handleTriggerSample = (sample: (typeof SAMPLE_DATASETS)[0]) => {
    handleClear();
    const blob = sample.generate();
    onSampleSelect(blob, sample.filename, {
      useAi,
      apiKey: apiKey.trim() || undefined,
      useOcr,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${dragActive
          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[1.01]"
          : "border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white/70 dark:bg-slate-900/70"
          } ${selectedFile ? "cursor-default border-solid border-blue-500/50 bg-blue-50/20 dark:bg-blue-950/10" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleInputChange}
          disabled={isLoading}
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mb-4 shadow-xs">
              <UploadCloud className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Drag & Drop your Question Paper PDF here
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
              Supports English, Bengali (বাংলা), and bilingual exam papers. Text-based
              and scanned PDFs supported.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors">
              <FileText className="w-4 h-4" />
              Browse PDF from Computer
            </div>
            <div className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              Maximum file size: 150MB • PDF only
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-xs">
              <div className="p-3 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
                  {selectedFile.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                disabled={isLoading}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Remove selected file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleStartExtraction();
              }}
              disabled={isLoading}
              className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              Extract MCQs Now
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Validation Error Banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Upload Error: </span>
            {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Advanced Extraction Options Toggle */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 uppercase tracking-wider"
        >
          <span className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-blue-500" />
            Extraction Options (OCR & AI Assistance)
          </span>
          <span className="text-blue-600 dark:text-blue-400 lowercase text-xs">
            {showAdvanced ? "hide" : "configure"}
          </span>
        </button>

        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 text-sm animate-in fade-in-50">
            {/* OCR Mode */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200">
                  OCR Processing Mode
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Auto-detects scanned pages with Tesseract.js fallback
                </div>
              </div>
              <select
                value={useOcr}
                onChange={(e) => setUseOcr(e.target.value as "auto" | "force" | "none")}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">Auto (Text first, OCR if scanned)</option>
                <option value="force">Force OCR on all pages</option>
                <option value="none">Text Only (Skip OCR)</option>
              </select>
            </div>

            {/* AI Assistant Toggle */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    AI Enhancement (Gemini / OpenAI)
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Uses LLM schema validation for complex or disordered layouts
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={useAi}
                  onChange={(e) => setUseAi(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>

              {useAi && (
                <div className="mt-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    API Key (Optional if server environment variable configured):
                  </label>
                  <input
                    type="password"
                    placeholder="Enter Gemini API key or OpenAI key..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Keys are kept secure in memory and never stored.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 1-Click Sample Exam Papers for quick testing */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Quick Test Drive: Sample Question Papers
          </span>
          <span className="text-[11px] font-normal lowercase text-slate-400">
            instant 1-click load
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {SAMPLE_DATASETS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleTriggerSample(sample)}
              disabled={isLoading}
              className="flex flex-col text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 shadow-2xs hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {sample.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium">
                  {sample.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                {sample.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
