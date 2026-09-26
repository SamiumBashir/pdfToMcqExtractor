"use client";

import React, { useState, useEffect } from "react";
import {
  StructuredQuestion,
  MCQQuestion,
  SVGLayoutConfig,
  DEFAULT_SVG_CONFIG,
  toStructuredQuestion,
} from "@/types/question";
import { generateQuestionSvg, downloadSvgFile } from "@/lib/svg/svg-generator";
import {
  X,
  Download,
  Eye,
  Settings2,
  Palette,
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "./toast";

interface SvgEditorModalProps {
  question: StructuredQuestion | MCQQuestion | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SvgEditorModal({ question, isOpen, onClose }: SvgEditorModalProps) {
  const { showToast } = useToast();

  const [config, setConfig] = useState<SVGLayoutConfig>(DEFAULT_SVG_CONFIG);
  const [svgPreview, setSvgPreview] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"layout" | "style" | "content">("layout");

  const sq = question
    ? "options" in question && Array.isArray(question.options)
      ? (question as StructuredQuestion)
      : toStructuredQuestion(question as MCQQuestion)
    : null;

  useEffect(() => {
    if (sq) {
      const generated = generateQuestionSvg(sq, config);
      setSvgPreview(generated);
    }
  }, [sq, config]);

  if (!isOpen || !sq) return null;

  const handleDownload = () => {
    const filename = `Question-${String(sq.questionNumber).padStart(3, "0")}.svg`;
    downloadSvgFile(svgPreview, filename);
    showToast("SVG Exported", `Downloaded ${filename} successfully`, "success");
  };

  const handleReset = () => {
    setConfig(DEFAULT_SVG_CONFIG);
    showToast("Reset to Defaults", "SVG layout configuration reset", "info");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                SVG Studio & Vector Editor
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold">
                  Q#{sq.questionNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate high-resolution semantic vector SVG with dual-panel layout
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download SVG
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: Left Controls & Right Live SVG Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Configuration Panel */}
          <div className="lg:col-span-4 p-5 border-r border-slate-200 dark:border-slate-800 overflow-y-auto space-y-5 bg-slate-50/30 dark:bg-slate-900/50">
            {/* Tabs */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              <button
                onClick={() => setActiveTab("layout")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  activeTab === "layout"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Dimensions
              </button>
              <button
                onClick={() => setActiveTab("style")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  activeTab === "style"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                Typography
              </button>
              <button
                onClick={() => setActiveTab("content")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  activeTab === "content"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                Theme & Toggles
              </button>
            </div>

            {/* Tab 1: Layout & Dimensions */}
            {activeTab === "layout" && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                    Canvas Width <span>{config.width}px</span>
                  </label>
                  <input
                    type="range"
                    min={800}
                    max={1800}
                    step={20}
                    value={config.width}
                    onChange={(e) => setConfig({ ...config, width: Number(e.target.value) })}
                    className="w-full mt-1.5 accent-blue-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                    Canvas Height <span>{config.height}px</span>
                  </label>
                  <input
                    type="range"
                    min={450}
                    max={1000}
                    step={20}
                    value={config.height}
                    onChange={(e) => setConfig({ ...config, height: Number(e.target.value) })}
                    className="w-full mt-1.5 accent-blue-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                    Padding <span>{config.padding}px</span>
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={80}
                    step={4}
                    value={config.padding}
                    onChange={(e) => setConfig({ ...config, padding: Number(e.target.value) })}
                    className="w-full mt-1.5 accent-blue-600"
                  />
                </div>

                {config.showAnswer && (
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                      Question Width vs Answer Width
                    </label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                        <span className="text-[10px] text-slate-400 block">Question Area</span>
                        <span className="font-bold">{config.questionSectionWidth}px</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                        <span className="text-[10px] text-slate-400 block">Answer Area</span>
                        <span className="font-bold">{config.answerSectionWidth}px</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Typography */}
            {activeTab === "style" && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                    Question Font Size <span>{config.questionFontSize}px</span>
                  </label>
                  <input
                    type="range"
                    min={18}
                    max={40}
                    step={1}
                    value={config.questionFontSize}
                    onChange={(e) => setConfig({ ...config, questionFontSize: Number(e.target.value) })}
                    className="w-full mt-1.5 accent-blue-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                    Option Font Size <span>{config.optionFontSize}px</span>
                  </label>
                  <input
                    type="range"
                    min={14}
                    max={30}
                    step={1}
                    value={config.optionFontSize}
                    onChange={(e) => setConfig({ ...config, optionFontSize: Number(e.target.value) })}
                    className="w-full mt-1.5 accent-blue-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                    Answer Font Size <span>{config.answerFontSize}px</span>
                  </label>
                  <input
                    type="range"
                    min={18}
                    max={36}
                    step={1}
                    value={config.answerFontSize}
                    onChange={(e) => setConfig({ ...config, answerFontSize: Number(e.target.value) })}
                    className="w-full mt-1.5 accent-blue-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Font Family
                  </label>
                  <select
                    value={config.fontFamily}
                    onChange={(e) => setConfig({ ...config, fontFamily: e.target.value })}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    <option value="'Hind Siliguri', 'Inter', sans-serif">Hind Siliguri (Bengali + English)</option>
                    <option value="'Inter', -apple-system, sans-serif">Inter (Clean Modern Sans)</option>
                    <option value="'Segoe UI', Roboto, sans-serif">Segoe UI / System</option>
                    <option value="Georgia, serif">Georgia (Classic Academic)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Tab 3: Themes & Toggles */}
            {activeTab === "content" && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Color Theme
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "light", label: "Light Clean", color: "bg-white text-slate-800 border-slate-300" },
                      { id: "dark", label: "Dark Slate", color: "bg-slate-900 text-white border-slate-700" },
                      { id: "navy-card", label: "Navy Blue", color: "bg-blue-950 text-blue-200 border-blue-800" },
                      { id: "emerald-paper", label: "Emerald Academic", color: "bg-emerald-950 text-emerald-200 border-emerald-800" },
                      { id: "exam-minimal", label: "Exam Minimal", color: "bg-white text-black border-black" },
                    ].map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => setConfig({ ...config, theme: th.id as any })}
                        className={`p-2 rounded-xl border text-left font-bold transition-all ${th.color} ${
                          config.theme === th.id ? "ring-2 ring-blue-500 scale-[1.02]" : "opacity-75 hover:opacity-100"
                        }`}
                      >
                        {th.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={config.showAnswer}
                      onChange={(e) => setConfig({ ...config, showAnswer: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    />
                    <span>Show Separate Answer Section</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={config.showConfidence}
                      onChange={(e) => setConfig({ ...config, showConfidence: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    />
                    <span>Show Confidence Score Badge</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={config.showWatermark}
                      onChange={(e) => setConfig({ ...config, showWatermark: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    />
                    <span>Show Watermark / Branding</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Right Live SVG Preview Panel */}
          <div className="lg:col-span-8 p-6 flex flex-col items-center justify-center bg-slate-100/70 dark:bg-slate-950/70 overflow-auto min-h-[480px]">
            <div className="w-full max-w-4xl bg-transparent rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
              <div
                dangerouslySetInnerHTML={{ __html: svgPreview }}
                className="w-full h-auto flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[580px] drop-shadow-md"
              />
            </div>
            <div className="mt-3 text-[11px] text-slate-400 font-medium">
              Pure vector SVG with semantic &lt;g id="question-section"&gt; &amp; &lt;g id="answer-section"&gt;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
