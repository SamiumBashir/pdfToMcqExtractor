import {
  StructuredQuestion,
  MCQQuestion,
  SVGLayoutConfig,
  DEFAULT_SVG_CONFIG,
  toStructuredQuestion,
} from "@/types/question";
import JSZip from "jszip";

/**
 * Escapes characters for safe inclusion in SVG XML attributes and text nodes.
 */
function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Wraps text into lines based on approximate character width for SVG <tspan> rendering.
 */
function wrapSvgLines(text: string, maxCharsPerLine: number = 42): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine ? currentLine + " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [text];
}

interface ThemePalette {
  bg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  badgeBg: string;
  badgeText: string;
  divider: string;
  optBg: string;
  optBorder: string;
  optKeyBg: string;
  optKeyText: string;
  ansSectionBg: string;
  ansSectionBorder: string;
  ansHighlightBg: string;
  ansHighlightText: string;
}

function getThemePalette(theme: SVGLayoutConfig["theme"]): ThemePalette {
  switch (theme) {
    case "dark":
      return {
        bg: "#090d16",
        cardBg: "#0f172a",
        cardBorder: "#1e293b",
        textPrimary: "#f8fafc",
        textSecondary: "#94a3b8",
        badgeBg: "#1e293b",
        badgeText: "#38bdf8",
        divider: "#1e293b",
        optBg: "#131d31",
        optBorder: "#1e293b",
        optKeyBg: "#1e293b",
        optKeyText: "#e2e8f0",
        ansSectionBg: "#0c1527",
        ansSectionBorder: "#1e293b",
        ansHighlightBg: "#064e3b",
        ansHighlightText: "#34d399",
      };
    case "navy-card":
      return {
        bg: "#020817",
        cardBg: "#0a192f",
        cardBorder: "#1e3a8a",
        textPrimary: "#f8fafc",
        textSecondary: "#93c5fd",
        badgeBg: "#172554",
        badgeText: "#60a5fa",
        divider: "#1e3a8a",
        optBg: "#0f2347",
        optBorder: "#1d4ed8",
        optKeyBg: "#1e3a8a",
        optKeyText: "#bfdbfe",
        ansSectionBg: "#081b38",
        ansSectionBorder: "#1d4ed8",
        ansHighlightBg: "#065f46",
        ansHighlightText: "#6ee7b7",
      };
    case "emerald-paper":
      return {
        bg: "#f4fbf7",
        cardBg: "#ffffff",
        cardBorder: "#d1fae5",
        textPrimary: "#064e3b",
        textSecondary: "#047857",
        badgeBg: "#ecfdf5",
        badgeText: "#059669",
        divider: "#a7f3d0",
        optBg: "#f0fdf4",
        optBorder: "#bbf7d0",
        optKeyBg: "#dcfce7",
        optKeyText: "#15803d",
        ansSectionBg: "#ecfdf5",
        ansSectionBorder: "#a7f3d0",
        ansHighlightBg: "#059669",
        ansHighlightText: "#ffffff",
      };
    case "exam-minimal":
      return {
        bg: "#ffffff",
        cardBg: "#ffffff",
        cardBorder: "#000000",
        textPrimary: "#000000",
        textSecondary: "#333333",
        badgeBg: "#f0f0f0",
        badgeText: "#000000",
        divider: "#000000",
        optBg: "#ffffff",
        optBorder: "#000000",
        optKeyBg: "#000000",
        optKeyText: "#ffffff",
        ansSectionBg: "#fafafa",
        ansSectionBorder: "#000000",
        ansHighlightBg: "#000000",
        ansHighlightText: "#ffffff",
      };
    case "light":
    default:
      return {
        bg: "#f8fafc",
        cardBg: "#ffffff",
        cardBorder: "#e2e8f0",
        textPrimary: "#0f172a",
        textSecondary: "#475569",
        badgeBg: "#eff6ff",
        badgeText: "#2563eb",
        divider: "#e2e8f0",
        optBg: "#f8fafc",
        optBorder: "#e2e8f0",
        optKeyBg: "#e2e8f0",
        optKeyText: "#334155",
        ansSectionBg: "#f0fdf4",
        ansSectionBorder: "#bbf7d0",
        ansHighlightBg: "#059669",
        ansHighlightText: "#ffffff",
      };
  }
}

/**
 * Generates semantic, vector-pure SVG string representing the Question + Options and Answer Section.
 * Adheres strictly to Section 19, 20, and 21 of the specification.
 */
export function generateQuestionSvg(
  questionInput: StructuredQuestion | MCQQuestion,
  customConfig?: Partial<SVGLayoutConfig>
): string {
  const sq = "options" in questionInput && Array.isArray(questionInput.options)
    ? (questionInput as StructuredQuestion)
    : toStructuredQuestion(questionInput as MCQQuestion);

  const config: SVGLayoutConfig = {
    ...DEFAULT_SVG_CONFIG,
    ...customConfig,
  };

  const palette = getThemePalette(config.theme);
  const { width, height, padding } = config;

  const leftWidth = config.showAnswer ? config.questionSectionWidth : width - padding * 2;
  const rightWidth = config.showAnswer ? config.answerSectionWidth : 0;
  const dividerX = padding + leftWidth + 24;
  const rightX = dividerX + 24;

  // Question wrapping
  const qMaxChars = Math.max(25, Math.floor(leftWidth / (config.questionFontSize * 0.62)));
  const questionLines = wrapSvgLines(sq.question.text, qMaxChars);
  const qLineHeight = config.questionFontSize * config.lineHeight;

  // Options configuration
  const optMaxChars = Math.max(20, Math.floor((leftWidth - 60) / (config.optionFontSize * 0.58)));
  const optLineHeight = config.optionFontSize * config.lineHeight;

  let currentY = padding + 40;

  // Header element
  const qNumStr = String(sq.questionNumber).padStart(2, "0");
  const pageStr = sq.source?.pageNumber ? `Page ${sq.source.pageNumber}` : "";

  // Build question <tspan> elements
  const questionTspans = questionLines
    .map(
      (line, idx) =>
        `<tspan x="${padding + 24}" dy="${idx === 0 ? 0 : qLineHeight}">${escapeXml(
          line
        )}</tspan>`
    )
    .join("");

  const questionBlockHeight = questionLines.length * qLineHeight;
  currentY += questionBlockHeight + 20;

  // Build Options Elements
  const optionsSvgList: string[] = [];
  const optionsStartY = currentY;

  sq.options.forEach((opt, idx) => {
    const isAnswer = config.showAnswer && sq.answer?.key === opt.key;
    const optLines = wrapSvgLines(opt.text, optMaxChars);
    const boxHeight = Math.max(46, optLines.length * optLineHeight + 18);

    const optY = optionsStartY + idx * (boxHeight + 12);

    const optKeyBg = isAnswer ? palette.ansHighlightBg : palette.optKeyBg;
    const optKeyText = isAnswer ? palette.ansHighlightText : palette.optKeyText;
    const optBorder = isAnswer ? palette.ansHighlightBg : palette.optBorder;

    const tspans = optLines
      .map(
        (l, i) =>
          `<tspan x="${padding + 78}" dy="${i === 0 ? 0 : optLineHeight}">${escapeXml(
            l
          )}</tspan>`
      )
      .join("");

    optionsSvgList.push(`
      <g id="option-${escapeXml(opt.key)}" class="option-row">
        <!-- Option Box Background -->
        <rect x="${padding + 24}" y="${optY}" width="${leftWidth - 24}" height="${boxHeight}" rx="12"
          fill="${palette.optBg}" stroke="${optBorder}" stroke-width="1.2" />
        
        <!-- Option Key Circle/Square -->
        <rect x="${padding + 36}" y="${optY + 9}" width="28" height="28" rx="8"
          fill="${optKeyBg}" />
        <text x="${padding + 50}" y="${optY + 28}" text-anchor="middle"
          fill="${optKeyText}" font-size="${config.optionFontSize * 0.85}px" font-weight="700"
          font-family="${escapeXml(config.fontFamily)}">${escapeXml(opt.key)}</text>
        
        <!-- Option Content Text -->
        <text x="${padding + 78}" y="${optY + 29}"
          fill="${palette.textPrimary}" font-size="${config.optionFontSize}px" font-weight="500"
          font-family="${escapeXml(config.fontFamily)}">
          ${tspans}
        </text>
      </g>
    `);
  });

  // Build Answer Section Elements (Right Column)
  let answerSectionSvg = "";
  if (config.showAnswer) {
    const ansKey = sq.answer?.key || "-";
    const ansText = sq.answer?.text || (sq.answer?.key ? sq.options.find(o => o.key === sq.answer?.key)?.text || "" : "Not Detected");
    const ansWrappedLines = wrapSvgLines(ansText, Math.max(16, Math.floor(rightWidth / (config.answerFontSize * 0.65))));
    const ansLineHeight = config.answerFontSize * config.lineHeight;

    const ansTspans = ansWrappedLines
      .map(
        (line, idx) =>
          `<tspan x="${rightX + 24}" dy="${idx === 0 ? 0 : ansLineHeight}">${escapeXml(
            line
          )}</tspan>`
      )
      .join("");

    const confidencePercent = Math.round(sq.confidence.overall * 100);

    answerSectionSvg = `
      <!-- Divider between Question and Answer -->
      <line id="section-divider" x1="${dividerX}" y1="${padding + 30}" x2="${dividerX}" y2="${height - padding - 30}"
        stroke="${palette.divider}" stroke-width="1.5" stroke-dasharray="4 4" />

      <!-- Answer Section -->
      <g id="answer-section">
        <!-- Answer Container Box -->
        <rect x="${rightX}" y="${padding + 30}" width="${rightWidth - 24}" height="${height - padding * 2 - 60}" rx="18"
          fill="${palette.ansSectionBg}" stroke="${palette.ansSectionBorder}" stroke-width="1.5" />

        <!-- Header -->
        <text x="${rightX + 24}" y="${padding + 75}"
          fill="${palette.textSecondary}" font-size="14px" font-weight="700" letter-spacing="1.5"
          font-family="${escapeXml(config.fontFamily)}">CORRECT ANSWER</text>

        <!-- Big Key Badge -->
        <g id="answer-badge">
          <circle cx="${rightX + 60}" cy="${padding + 145}" r="34" fill="${palette.ansHighlightBg}" />
          <text x="${rightX + 60}" y="${padding + 157}" text-anchor="middle"
            fill="${palette.ansHighlightText}" font-size="${config.answerFontSize * 1.5}px" font-weight="800"
            font-family="${escapeXml(config.fontFamily)}">${escapeXml(ansKey)}</text>
        </g>

        <!-- Answer Description Text -->
        <text id="answer-content" x="${rightX + 24}" y="${padding + 225}"
          fill="${palette.textPrimary}" font-size="${config.answerFontSize}px" font-weight="600"
          font-family="${escapeXml(config.fontFamily)}">
          ${ansTspans}
        </text>

        <!-- Confidence & Status Indicators -->
        ${config.showConfidence ? `
        <g id="confidence-indicator" transform="translate(${rightX + 24}, ${height - padding - 95})">
          <rect x="0" y="0" width="${rightWidth - 72}" height="38" rx="10"
            fill="${palette.cardBg}" stroke="${palette.cardBorder}" stroke-width="1" />
          <circle cx="20" cy="19" r="5" fill="${confidencePercent >= 90 ? "#10b981" : "#f59e0b"}" />
          <text x="34" y="24" fill="${palette.textSecondary}" font-size="12px" font-weight="600"
            font-family="${escapeXml(config.fontFamily)}">Confidence: ${confidencePercent}% (${escapeXml(sq.confidence.level)})</text>
        </g>
        ` : ""}

        <!-- Verified Status Badge -->
        <g id="verified-badge" transform="translate(${rightX + 24}, ${height - padding - 45})">
          <text x="0" y="0" fill="${palette.textSecondary}" font-size="11px" font-weight="500"
            font-family="${escapeXml(config.fontFamily)}">Status: ${escapeXml(sq.status.toUpperCase())}</text>
        </g>
      </g>
    `;
  }

  // Full SVG Document
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" data-question-number="${sq.questionNumber}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&amp;family=Inter:wght@400;500;600;700;800&amp;display=swap');
      text { font-family: ${config.fontFamily}; }
      .option-row:hover rect { opacity: 0.95; }
    </style>
  </defs>

  <!-- Canvas Outer Background -->
  <rect width="${width}" height="${height}" fill="${palette.bg}" />

  <!-- Main Card Container -->
  <rect x="${padding}" y="${padding}" width="${width - padding * 2}" height="${height - padding * 2}" rx="${config.borderRadius || 24}"
    fill="${palette.cardBg}" stroke="${palette.cardBorder}" stroke-width="${config.borderWidth || 1.5}" />

  <!-- Header Section -->
  <g id="header-section">
    <!-- Question Number Badge -->
    <rect x="${padding + 24}" y="${padding + 24}" width="140" height="32" rx="10"
      fill="${palette.badgeBg}" />
    <text x="${padding + 94}" y="${padding + 45}" text-anchor="middle"
      fill="${palette.badgeText}" font-size="13px" font-weight="700" letter-spacing="0.5"
      font-family="${escapeXml(config.fontFamily)}">QUESTION ${qNumStr}</text>

    <!-- Source / Page Number Badge -->
    ${pageStr ? `
    <text x="${padding + 180}" y="${padding + 45}"
      fill="${palette.textSecondary}" font-size="12px" font-weight="500"
      font-family="${escapeXml(config.fontFamily)}">${escapeXml(pageStr)}</text>
    ` : ""}

    <!-- Watermark / Platform Branding -->
    ${config.showWatermark ? `
    <text x="${width - padding - 24}" y="${padding + 45}" text-anchor="end"
      fill="${palette.textSecondary}" font-size="11px" font-weight="600" opacity="0.7"
      font-family="${escapeXml(config.fontFamily)}">${escapeXml(config.watermarkText || "Question Platform")}</text>
    ` : ""}
  </g>

  <!-- Question Section -->
  <g id="question-section">
    <text id="question" x="${padding + 24}" y="${padding + 95}"
      fill="${palette.textPrimary}" font-size="${config.questionFontSize}px" font-weight="700"
      font-family="${escapeXml(config.fontFamily)}">
      ${questionTspans}
    </text>

    <!-- Options Group -->
    <g id="options-group">
      ${optionsSvgList.join("\n")}
    </g>
  </g>

  ${answerSectionSvg}
</svg>`;
}

/**
 * Triggers a browser download of an SVG string as a file.
 */
export function downloadSvgFile(svgContent: string, filename: string = "question.svg"): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".svg") ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Programmatic alias for generateQuestionSvg
 */
export const generateMCQSVG = generateQuestionSvg;

/**
 * Generates a JSZip blob containing all questions as individual SVG files.
 */
export async function generateMCQBundleZip(
  questions: Array<StructuredQuestion | MCQQuestion>,
  config?: Partial<SVGLayoutConfig>
): Promise<Blob> {
  const zip = new JSZip();

  questions.forEach((q, idx) => {
    const sq = "options" in q && Array.isArray(q.options)
      ? (q as StructuredQuestion)
      : toStructuredQuestion(q as MCQQuestion);

    const svgContent = generateQuestionSvg(sq, config);
    const num = String(sq.questionNumber || idx + 1).padStart(3, "0");
    zip.file(`Question-${num}.svg`, svgContent);
  });

  return await zip.generateAsync({ type: "blob" });
}

/**
 * Generates and downloads a ZIP package containing all questions as individual SVG files.
 * Adheres strictly to Section 22: Bulk SVG Export.
 */
export async function downloadBulkSvgZip(
  questions: Array<StructuredQuestion | MCQQuestion>,
  config?: Partial<SVGLayoutConfig>,
  zipFilename: string = "questions-svg-bundle.zip"
): Promise<void> {
  const zipBlob = await generateMCQBundleZip(questions, config);
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipFilename.endsWith(".zip") ? zipFilename : `${zipFilename}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

