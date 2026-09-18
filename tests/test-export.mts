import {
  exportToCSV,
  exportToJSON,
  exportToExcel,
  exportToWord,
  formatAllQuestionsText,
  formatSingleQuestionText,
} from "../src/lib/export";
import { MCQQuestion } from "../src/types/question";
import * as fs from "fs";

const sampleQuestions: MCQQuestion[] = [
  {
    id: "q1",
    number: 1,
    question: "What is the capital of Bangladesh?",
    options: {
      A: "Chittagong",
      B: "Dhaka",
      C: "Sylhet",
      D: "Rajshahi",
    },
    correctAnswer: "B",
    confidence: "high",
    status: "answered",
    pageNumber: 1,
  },
  {
    id: "q2",
    number: 2,
    question: "বাংলাদেশের জাতীয় পশু কোনটি?",
    options: {
      A: "সিংহ",
      B: "রয়েল বেঙ্গল টাইগার",
      C: "হাতি",
      D: "হরিণ",
    },
    correctAnswer: "B",
    confidence: "high",
    status: "answered",
    pageNumber: 1,
  },
  {
    id: "q3",
    number: 3,
    question: "What is the speed of sound in air?",
    options: {
      A: "343 m/s",
      B: "300 m/s",
      C: "1500 m/s",
      D: "None",
    },
    correctAnswer: null,
    confidence: "needs-review",
    status: "missing_answer",
    pageNumber: 2,
  },
];

async function testExports() {
  console.log("=== Testing Export Suite ===");

  // 1. Text
  const txt = formatAllQuestionsText(sampleQuestions);
  console.log("TXT length:", txt.length);
  if (!txt.includes("Dhaka") || !txt.includes("রয়েল বেঙ্গল টাইগার")) {
    throw new Error("TXT format missing expected text");
  }

  // 2. JSON
  const jsonStr = exportToJSON(sampleQuestions);
  const parsed = JSON.parse(jsonStr);
  console.log("JSON parsed question count:", parsed.questions.length);
  if (parsed.questions.length !== 3) throw new Error("JSON question count mismatch");

  // 3. CSV with BOM
  const csvStr = exportToCSV(sampleQuestions);
  console.log("CSV has BOM (\\uFEFF):", csvStr.startsWith("\uFEFF"));
  if (!csvStr.startsWith("\uFEFF")) throw new Error("CSV missing UTF-8 BOM");

  // 4. Excel
  const excelBuffer = exportToExcel(sampleQuestions);
  console.log("Excel buffer byte length:", excelBuffer.byteLength);
  if (excelBuffer.byteLength < 500) throw new Error("Excel buffer too small");

  // 5. Word
  const wordBlob = await exportToWord(sampleQuestions);
  console.log("Word docx blob size:", wordBlob.size);
  if (wordBlob.size < 1000) throw new Error("Word blob too small");

  console.log("=== ALL EXPORT TESTS PASSED SUCCESSFULLY! ===");
}

testExports().catch((err) => {
  console.error("Export test failed:", err);
  process.exit(1);
});
