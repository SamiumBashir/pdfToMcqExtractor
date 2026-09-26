"use client";

import React, { useState } from "react";
import { StructuredQuestion, QuestionOptionItem } from "@/types/question";
import { X, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useToast } from "./toast";

interface ManualQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: StructuredQuestion) => void;
  nextNumber: number;
}

export function ManualQuestionModal({
  isOpen,
  onClose,
  onSave,
  nextNumber,
}: ManualQuestionModalProps) {
  const { showToast } = useToast();

  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<QuestionOptionItem[]>([
    { key: "A", text: "" },
    { key: "B", text: "" },
    { key: "C", text: "" },
    { key: "D", text: "" },
  ]);
  const [correctKey, setCorrectKey] = useState("A");
  const [category, setCategory] = useState("General Knowledge");

  if (!isOpen) return null;

  const handleAddOption = () => {
    const letters = ["A", "B", "C", "D", "E", "F", "G"];
    const nextKey = letters[options.length] || `Opt${options.length + 1}`;
    setOptions([...options, { key: nextKey, text: "" }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      showToast("Minimum 2 Options", "An MCQ must contain at least 2 options", "info");
      return;
    }
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    if (correctKey === options[index]?.key) {
      setCorrectKey(updated[0]?.key || "A");
    }
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index].text = text;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionText.trim()) {
      showToast("Question Required", "Please enter the question text", "error");
      return;
    }

    const filledOptions = options.filter((o) => o.text.trim().length > 0);
    if (filledOptions.length < 2) {
      showToast("Incomplete Options", "Please fill in at least 2 options", "error");
      return;
    }

    const matchedAns = filledOptions.find((o) => o.key === correctKey);
    const ansItem = matchedAns
      ? { key: correctKey, text: matchedAns.text.trim() }
      : { key: filledOptions[0].key, text: filledOptions[0].text.trim() };

    const newQuestion: StructuredQuestion = {
      _id: `manual-${Date.now()}`,
      id: `manual-${Date.now()}`,
      questionNumber: nextNumber,
      question: { text: questionText.trim() },
      options: filledOptions,
      answer: ansItem,
      source: {
        documentId: "manual-entry",
        documentName: "Manual Entry",
        pageNumber: 1,
      },
      confidence: {
        question: 1.0,
        options: 1.0,
        answer: 1.0,
        overall: 1.0,
        level: "high",
      },
      status: "verified",
      category,
      tags: ["Manual Entry"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newQuestion);
    showToast("Question Created", `Added Question #${nextNumber} to Question Bank`, "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Create New Question #{nextNumber}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manually add a multiple-choice question to your question bank
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Question Text */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Question Text *
            </label>
            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. What is the national flower of Bangladesh? / বাংলাদেশের জাতীয় ফুল কোনটি?"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Options &amp; Correct Answer *
              </label>
              <button
                type="button"
                onClick={handleAddOption}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Option
              </button>
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => {
                const isSelected = correctKey === opt.key;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-1.5 rounded-xl border transition-colors ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    }`}
                  >
                    {/* Radio Button to select correct answer */}
                    <button
                      type="button"
                      onClick={() => setCorrectKey(opt.key)}
                      title="Set as correct answer"
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      {opt.key}
                    </button>

                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                      placeholder={`Option ${opt.key} text`}
                      className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-slate-100 outline-none"
                      required
                    />

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Click on an option letter badge to designate it as the Correct Answer.
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category / Subject
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Bangladesh Affairs, Science, English"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Question
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
