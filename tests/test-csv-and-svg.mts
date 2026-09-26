import { exportToStandardCSV, importFromStandardCSV, detectDuplicateQuestions } from "../src/lib/csv-manager";
import { generateMCQSVG, generateMCQBundleZip } from "../src/lib/svg/svg-generator";
import { MCQQuestion, toStructuredQuestion } from "../src/types/question";

const mockQuestions: MCQQuestion[] = [
  {
    id: "q-1",
    number: 1,
    rawNumber: "১",
    question: "বাংলাদেশের রাজধানী কোনটি?",
    options: {
      A: "চট্টগ্রাম",
      B: "ঢাকা",
      C: "রাজশাহী",
      D: "খুলনা",
    },
    correctAnswer: "B",
    confidence: "high",
    status: "answered",
    pageNumber: 1,
  },
  {
    id: "q-2",
    number: 2,
    rawNumber: "2",
    question: "What is the capital of Bangladesh?",
    options: {
      A: "Chittagong",
      B: "Dhaka",
      C: "Rajshahi",
      D: "Khulna",
    },
    correctAnswer: "B",
    confidence: "high",
    status: "answered",
    pageNumber: 1,
  },
  {
    id: "q-3",
    number: 3,
    rawNumber: "3",
    question: "What is the capital of Bangladesh?",
    options: {
      A: "Chittagong",
      B: "Dhaka",
      C: "Rajshahi",
      D: "Khulna",
    },
    correctAnswer: "B",
    confidence: "high",
    status: "answered",
    pageNumber: 2,
  },
];

async function runTests() {
  console.log("=== Testing Section 46 CSV Export ===");
  const csvOutput = exportToStandardCSV(mockQuestions);
  console.log("CSV Starts with UTF-8 BOM:", csvOutput.startsWith("\uFEFF"));
  console.log("CSV Content preview:\n" + csvOutput.slice(0, 250));
  
  const expectedHeader = "question,option_a,option_b,option_c,option_d,answer";
  if (!csvOutput.includes(expectedHeader)) {
    throw new Error(`CSV header does not match Section 46 contract! Found: ${csvOutput.split("\n")[0]}`);
  }
  console.log("✓ CSV Header matches exact contract: question,option_a,option_b,option_c,option_d,answer");

  console.log("\n=== Testing Section 18 CSV Import ===");
  const importResult = importFromStandardCSV(csvOutput);
  console.log("Import result:", {
    totalRows: importResult.totalRows,
    validCount: importResult.validCount,
    invalidCount: importResult.invalidCount,
    duplicateCount: importResult.duplicateCount,
    validQuestionsCount: importResult.validQuestions.length,
  });

  if (importResult.validCount !== 3) {
    throw new Error(`Expected 3 valid questions, got ${importResult.validCount}`);
  }
  console.log("✓ CSV parsed accurately!");

  console.log("\n=== Testing Duplicate Question Detection ===");
  const duplicates = detectDuplicateQuestions(mockQuestions);
  console.log("Duplicate map size:", duplicates.size);
  if (duplicates.size === 0) {
    throw new Error("Expected duplicates to be detected between Q2 and Q3!");
  }
  console.log("✓ Duplicates detected for ids:", Array.from(duplicates.keys()));

  console.log("\n=== Testing SVG Vector Generation ===");
  const structuredQ = toStructuredQuestion(mockQuestions[0]);
  const svgOutput = generateMCQSVG(structuredQ);
  console.log("SVG generated length:", svgOutput.length);
  if (!svgOutput.includes('<svg') || !svgOutput.includes('id="question-section"') || !svgOutput.includes('id="answer-section"')) {
    throw new Error("SVG output missing required vector groups!");
  }
  console.log("✓ SVG contains <g id='question-section'> and <g id='answer-section'>");

  console.log("\n=== Testing SVG ZIP Bundle Generation ===");
  const zipBlob = await generateMCQBundleZip(mockQuestions.map(toStructuredQuestion));
  console.log("ZIP blob generated size:", zipBlob.size, "bytes");
  if (zipBlob.size < 500) {
    throw new Error("ZIP blob seems too small!");
  }
  console.log("✓ SVG ZIP Bundle successfully created!");

  console.log("\n=== ALL CSV & SVG TESTS PASSED PERFECTLY ===");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
