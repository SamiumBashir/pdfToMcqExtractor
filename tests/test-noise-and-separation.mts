import { parseMCQDocument } from "../src/lib/question-parser";

async function runNoiseAndSeparationTests() {
  console.log("=== Testing Noise Rejection & Multi-Line Parsing ===");

  const complexDocWithNoise = `
বাংলাদেশ সাধারণ জ্ঞান সহায়িকা
Chapter 1: জাতীয় পরিচিতি ও ইতিহাস
Author: ড. মো. রফিকুল ইসলাম
Copyright © 2026 BCS Publications. All Rights Reserved.
Page 12

Instructions: Select the best answer for each question. Negative marks apply.

১। বাংলাদেশের মুক্তিযুদ্ধের সময়
কোন দেশ বাংলাদেশকে প্রথম স্বীকৃতি
দিয়েছিল?

ক) ভারত
খ) ভুটান
গ) রাশিয়া
ঘ) নেপাল

উত্তর: খ
ব্যাখ্যা: ১৯৭১ সালের ৬ ডিসেম্বর ভুটান বাংলাদেশকে প্রথম আনুষ্ঠানিক স্বীকৃতি প্রদান করে। ভারত কয়েক ঘণ্টা পর একই দিনে স্বীকৃতি দেয়।

Important Notice for Candidates:
Calculators are not allowed inside the exam hall.

2. In which year was the historic
Six-Point Movement presented by
Bangabandhu Sheikh Mujibur Rahman?
(a) 1964
(b) 1966
(c) 1969
(d) 1971

Ans: (b)

Page 13
Chapter 1 Continued

3. Which of the following is considered an unverified question without any answer?
A. Option One
B. Option Two
C. Option Three
D. Option Four

End of Chapter 1
Feedback: info@examportal.com
`;

  const parsed = parseMCQDocument(complexDocWithNoise);
  console.log(`Parsed total questions: ${parsed.length}`);

  if (parsed.length !== 3) {
    throw new Error(`Expected exactly 3 questions, got ${parsed.length}`);
  }

  // Check Question 1 (Bengali Multi-line + Noise Rejection)
  const q1 = parsed[0];
  console.log("Q1 Question text:", JSON.stringify(q1.question));
  console.log("Q1 Options:", q1.options);
  console.log("Q1 Answer:", q1.correctAnswer);

  if (q1.question.includes("Chapter 1") || q1.question.includes("Copyright") || q1.question.includes("Author")) {
    throw new Error("Q1 contains header/author/chapter noise!");
  }
  if (!q1.question.includes("স্বীকৃতি") || !q1.question.includes("দিয়েছিল")) {
    throw new Error("Q1 failed to preserve multi-line Bengali question text!");
  }
  // Bengali option 'খ' maps to 'B'
  if (q1.correctAnswer !== "B") {
    throw new Error(`Expected Q1 answer to be normalized to 'B', got '${q1.correctAnswer}'`);
  }
  if (!q1.options["B"].includes("ভুটান")) {
    throw new Error("Q1 option B should be ভুটান");
  }

  // Check Question 2 (English Multi-line)
  const q2 = parsed[1];
  console.log("Q2 Question text:", JSON.stringify(q2.question));
  console.log("Q2 Options:", q2.options);
  console.log("Q2 Answer:", q2.correctAnswer);

  if (q2.question.includes("Notice") || q2.question.includes("Calculators")) {
    throw new Error("Q2 contains exam instructions noise!");
  }
  if (!q2.question.includes("Six-Point") || !q2.question.includes("Rahman")) {
    throw new Error("Q2 failed multi-line text merge!");
  }
  if (q2.correctAnswer !== "B") {
    throw new Error(`Expected Q2 answer to be 'B', got '${q2.correctAnswer}'`);
  }

  // Check Question 3 (No answer provided - must not hallucinate)
  const q3 = parsed[2];
  console.log("Q3 Question text:", JSON.stringify(q3.question));
  console.log("Q3 Answer:", q3.correctAnswer);
  console.log("Q3 Status:", q3.status);

  if (q3.correctAnswer !== null) {
    throw new Error(`Expected Q3 to have no hallucinated answer, but got '${q3.correctAnswer}'!`);
  }
  if (q3.status !== "missing_answer" && q3.status !== "needs_review") {
    throw new Error(`Expected Q3 status to be missing_answer or needs_review, got '${q3.status}'`);
  }

  console.log("✓ Noise filtering, multi-line questions, and non-hallucination passed flawlessly!");

  console.log("\n=== Testing Standalone Answer Key Mapping ===");
  const docWithSeparateKey = `
Model Test 01 - General Knowledge

1. What is the currency of Japan?
A. Won
B. Yen
C. Yuan
D. Baht

2. The Great Barrier Reef is situated off the coast of:
A. South Africa
B. Australia
C. Brazil
D. Indonesia

Answer Key:
1-B, 2-B
`;

  const parsedKeyDoc = parseMCQDocument(docWithSeparateKey);
  console.log(`Parsed questions with key: ${parsedKeyDoc.length}`);
  if (parsedKeyDoc.length !== 2) {
    throw new Error(`Expected 2 questions from answer key doc, got ${parsedKeyDoc.length}`);
  }
  if (parsedKeyDoc[0].correctAnswer !== "B" || parsedKeyDoc[1].correctAnswer !== "B") {
    throw new Error(`Answer key mapping failed! Q1: ${parsedKeyDoc[0].correctAnswer}, Q2: ${parsedKeyDoc[1].correctAnswer}`);
  }

  console.log("✓ Standalone answer key correctly resolved and mapped to questions!");
  console.log("\n=== ALL NOISE AND SEPARATION TESTS COMPLETED SUCCESSFULLY ===");
}

runNoiseAndSeparationTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
