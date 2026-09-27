import { parseMCQDocument } from "../src/lib/question-parser";
import { normalizeExtractedText } from "../src/lib/text-normalizer";

const mangledSample = `৩৮। খলাকসারহশতযর প্রািীনতম রনেন্থন থকানরি? ক. প্র বি . খলাকীরত 🗲. ছিয়া ঘ. রেভিয়ান উ. 🗲 বযা যা: জনসাধারশর্র মুখ মুখপ্র চলত ...`;

const normalized = normalizeExtractedText(mangledSample);
console.log("Normalized text preview:\n", normalized);

const parsed = parseMCQDocument(normalized);
console.log("\nParsed count:", parsed.length);
if (parsed.length > 0) {
  console.log("Q1 Question:", JSON.stringify(parsed[0].question));
  console.log("Q1 Options:", parsed[0].options);
  console.log("Q1 Answer:", parsed[0].correctAnswer);
  console.log("Q1 Confidence:", parsed[0].confidence);
}
