import { MCQQuestion } from "@/types/question";
import * as XLSX from "xlsx";
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  AlignmentType,
  BorderStyle,
} from "docx";

/**
 * Formats a single question into plain text.
 */
export function formatSingleQuestionText(q: MCQQuestion): string {
  const lines: string[] = [];
  lines.push(`${q.number}. ${q.question}`);

  const options = q.options || {};
  const optionKeys = Object.keys(options).sort();

  for (const key of optionKeys) {
    lines.push(`   ${key}. ${options[key]}`);
  }

  if (q.correctAnswer) {
    const ansText = options[q.correctAnswer] ? ` (${options[q.correctAnswer]})` : "";
    lines.push(`   Answer: ${q.correctAnswer}${ansText}`);
  } else {
    lines.push(`   Answer: Not detected (Needs Review)`);
  }

  return lines.join("\n");
}

/**
 * Formats all questions into a single plain text string.
 */
export function formatAllQuestionsText(questions: MCQQuestion[]): string {
  return questions.map((q) => formatSingleQuestionText(q)).join("\n\n");
}

/**
 * Generates JSON string of questions.
 */
export function exportToJSON(questions: MCQQuestion[]): string {
  return JSON.stringify(
    {
      extractedAt: new Date().toISOString(),
      totalQuestions: questions.length,
      questions: questions.map((q) => ({
        number: q.number,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer || null,
        confidence: q.confidence,
        pageNumber: q.pageNumber,
      })),
    },
    null,
    2
  );
}

/**
 * Generates CSV string with UTF-8 BOM for Bengali support in Excel.
 */
export function exportToCSV(questions: MCQQuestion[]): string {
  const headers = [
    "Question No",
    "Question",
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Option E",
    "Correct Answer",
    "Confidence",
    "Page",
  ];

  const escapeCSV = (str: string | number | null | undefined): string => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = questions.map((q) => {
    return [
      escapeCSV(q.number),
      escapeCSV(q.question),
      escapeCSV(q.options["A"] || q.options["ক"] || ""),
      escapeCSV(q.options["B"] || q.options["খ"] || ""),
      escapeCSV(q.options["C"] || q.options["গ"] || ""),
      escapeCSV(q.options["D"] || q.options["ঘ"] || ""),
      escapeCSV(q.options["E"] || q.options["ঙ"] || ""),
      escapeCSV(q.correctAnswer || "Not detected"),
      escapeCSV(q.confidence),
      escapeCSV(q.pageNumber || 1),
    ].join(",");
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel respects UTF-8 (Bengali, accents, symbols)
  return "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
}

/**
 * Generates Excel (.xlsx) file buffer using xlsx library.
 */
export function exportToExcel(questions: MCQQuestion[]): Uint8Array {
  const data = questions.map((q) => ({
    "Question No": q.number,
    "Question": q.question,
    "Option A": q.options["A"] || q.options["ক"] || "",
    "Option B": q.options["B"] || q.options["খ"] || "",
    "Option C": q.options["C"] || q.options["গ"] || "",
    "Option D": q.options["D"] || q.options["ঘ"] || "",
    "Option E": q.options["E"] || q.options["ঙ"] || "",
    "Correct Answer": q.correctAnswer || "Not detected",
    "Confidence": q.confidence,
    "Status": q.status,
    "Page": q.pageNumber || 1,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 12 }, // Question No
    { wch: 50 }, // Question
    { wch: 25 }, // Option A
    { wch: 25 }, // Option B
    { wch: 25 }, // Option C
    { wch: 25 }, // Option D
    { wch: 20 }, // Option E
    { wch: 16 }, // Correct Answer
    { wch: 15 }, // Confidence
    { wch: 15 }, // Status
    { wch: 8 },  // Page
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "MCQ Questions");

  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Uint8Array(wbout);
}

/**
 * Generates a Microsoft Word (.docx) document using docx library.
 */
export async function exportToWord(questions: MCQQuestion[]): Promise<Blob> {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      text: "PDF MCQ Extractor - Question Bank",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Total Questions: ${questions.length} | Generated: ${new Date().toLocaleDateString()}`,
          italics: true,
          color: "666666",
        }),
      ],
    })
  );

  for (let idx = 0; idx < questions.length; idx++) {
    const q = questions[idx];
    const options = q.options || {};
    const optionKeys = Object.keys(options).sort();

    // Question Header
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: `Q${q.number}. `,
            bold: true,
            color: "2563EB",
          }),
          new TextRun({
            text: q.question,
            bold: true,
          }),
        ],
      })
    );

    // Options
    for (const key of optionKeys) {
      const isCorrect = q.correctAnswer === key;
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 40 },
          indent: { left: 400 },
          children: [
            new TextRun({
              text: `${key}) `,
              bold: isCorrect,
              color: isCorrect ? "16A34A" : "333333",
            }),
            new TextRun({
              text: options[key] || "",
              bold: isCorrect,
              color: isCorrect ? "16A34A" : "333333",
            }),
            ...(isCorrect
              ? [
                  new TextRun({
                    text: "  ✓ (Correct Answer)",
                    bold: true,
                    color: "16A34A",
                  }),
                ]
              : []),
          ],
        })
      );
    }

    // Answer summary line
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 200 },
        indent: { left: 400 },
        children: [
          new TextRun({
            text: "Answer: ",
            bold: true,
            color: q.correctAnswer ? "16A34A" : "DC2626",
          }),
          new TextRun({
            text: q.correctAnswer
              ? `${q.correctAnswer}${options[q.correctAnswer] ? ` (${options[q.correctAnswer]})` : ""}`
              : "Not detected (Needs Review)",
            bold: true,
            color: q.correctAnswer ? "16A34A" : "DC2626",
          }),
          new TextRun({
            text: `  [Confidence: ${q.confidence}]`,
            italics: true,
            color: "888888",
            size: 18,
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
