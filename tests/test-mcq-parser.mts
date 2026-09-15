import { parseMCQDocument } from "../src/lib/question-parser";
import { PageTextData } from "../src/lib/pdf-parser";

const sampleEnglishInline = `
1. What is the capital of Bangladesh?
A. Chittagong
B. Dhaka
C. Sylhet
D. Rajshahi
Answer: B

2. What is 2 + 2?
(a) 3
(b) 4
(c) 5
(d) 6
Correct Answer: (b)

Q3. What is the chemical formula of Water?
A) CO2
B) H2O
C) O2
D) NaCl
Ans: B
`;

const sampleBengali = `
১। বাংলাদেশের জাতীয় প্রতীক কী?
ক) শাপলা
খ) গোলাপ
গ) পদ্ম
ঘ) সূর্যমুখী
উত্তর: ক

২। বাংলা বর্ণমালায় মোট কতটি বর্ণ রয়েছে?
ক) ৪৯টি
খ) ৫০টি
গ) ৫১টি
ঘ) ৫২টি
উত্তর: খ
`;

const sampleAnswerKey = `
1. What is the largest planet in our solar system?
A. Earth
B. Mars
C. Jupiter
D. Saturn

2. Which gas do plants absorb for photosynthesis?
A. Oxygen
B. Carbon Dioxide
C. Nitrogen
D. Hydrogen

Answer Key:
1-C
2-B
`;

function createPage(num: number, text: string): PageTextData {
  return { pageNumber: num, text, charCount: text.length };
}

console.log("--- Testing English Inline ---");
const res1 = parseMCQDocument([createPage(1, sampleEnglishInline)], sampleEnglishInline);
console.log(`Parsed ${res1.length} questions:`);
res1.forEach((q) => {
  console.log(`Q${q.number}: "${q.question}" -> Ans: ${q.correctAnswer} (${q.confidence})`);
});

console.log("\n--- Testing Bengali ---");
const res2 = parseMCQDocument([createPage(1, sampleBengali)], sampleBengali);
console.log(`Parsed ${res2.length} Bengali questions:`);
res2.forEach((q) => {
  console.log(`Q${q.number}: "${q.question}" -> Ans: ${q.correctAnswer} (${q.confidence})`);
});

console.log("\n--- Testing Separate Answer Key ---");
const res3 = parseMCQDocument([createPage(1, sampleAnswerKey)], sampleAnswerKey);
console.log(`Parsed ${res3.length} questions with Answer Key:`);
res3.forEach((q) => {
  console.log(`Q${q.number}: "${q.question}" -> Ans: ${q.correctAnswer} (${q.confidence})`);
});
