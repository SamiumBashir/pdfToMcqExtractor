"use client";

import React, { useState, useRef } from "react";
import { StructuredQuestion } from "@/types/question";
import { importFromStandardCSV, CSVImportResult } from "@/lib/csv-manager";
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { useToast } from "./toast";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (imported: StructuredQuestion[]) => void;
}

export function CsvImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: CsvImportModalProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = importFromStandardCSV(text);
        setImportResult(result);
      } catch (err) {
        showToast("CSV Parse Error", "Failed to parse CSV file.", "error");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleConfirmImport = () => {
    if (!importResult || importResult.validQuestions.length === 0) return;
    onImportComplete(importResult.validQuestions);
    showToast(
      "CSV Imported",
      `Successfully imported ${importResult.validQuestions.length} questions into Question Bank!`,
      "success"
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Import Questions from CSV
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Format: question, option_a, option_b, option_c, option_d, answer
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {!importResult ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Click or Drop your CSV file here
              </h4>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Supports UTF-8 encoded CSV files (English &amp; Bengali supported)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {fileName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setImportResult(null);
                    setFileName("");
                  }}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  Change File
                </button>
              </div>

              {/* Statistics Grid conforming to Section 18 */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-center">
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">
                    Total Rows
                  </span>
                  <span className="text-lg font-extrabold text-blue-900 dark:text-blue-200">
                    {importResult.totalRows}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-center">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                    Valid Rows
                  </span>
                  <span className="text-lg font-extrabold text-emerald-900 dark:text-emerald-200">
                    {importResult.validCount}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-center">
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block">
                    Invalid Rows
                  </span>
                  <span className="text-lg font-extrabold text-rose-900 dark:text-rose-200">
                    {importResult.invalidCount}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-center">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                    Duplicates
                  </span>
                  <span className="text-lg font-extrabold text-amber-900 dark:text-amber-200">
                    {importResult.duplicateCount}
                  </span>
                </div>
              </div>

              {/* Invalid Rows review */}
              {importResult.invalidRows.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1">
                  <span className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Review Issues Detected:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-rose-600 dark:text-rose-400 max-h-24 overflow-y-auto text-[11px]">
                    {importResult.invalidRows.slice(0, 5).map((err, i) => (
                      <li key={i}>
                        Row {err.rowNumber}: {err.reason}
                      </li>
                    ))}
                    {importResult.invalidRows.length > 5 && (
                      <li>...and {importResult.invalidRows.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!importResult || importResult.validCount === 0}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Import {importResult ? importResult.validCount : 0} Questions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
