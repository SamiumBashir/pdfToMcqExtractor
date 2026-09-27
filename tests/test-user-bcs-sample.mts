import { extractInlineAnswer } from "../src/lib/answer-parser";
import { parseMCQDocument } from "../src/lib/question-parser";

const sample = `৩৮। সূর্য থেকে পৃথিবীতে তাপ আসে কোন পদ্ধতিতে?
ক. পরিবহন     খ. পরিচালন
গ. বিকিরণ     ঘ. রশ্মিবিচ্ছুরণ
উ. গ
ব্যাখ্যা: তাপ সঞ্চালনের পদ্ধতি তিনটি। যথা- পরিবহন, পরিচালন, বিকিরণ। তাপ সঞ্চালনের দ্রুততম প্রক্রিয়া বিকিরণ। বিকিরণ প্রক্রিয়ায় তাপ তড়িৎ চৌম্বক তরঙ্গ আকারে সরলরেখায় আলোর বেগে সঞ্চালিত হয়।`;

console.log("--- TEST INLINE ANSWER ---");
const ansRes = extractInlineAnswer(sample);
console.log("Detected answer:", ansRes.correctAnswer);
console.log("Raw answer text:", ansRes.rawAnswerText);

console.log("\n--- TEST FULL PARSE ---");
const questions = parseMCQDocument(sample);
console.log("Questions parsed count:", questions.length);
if (questions.length > 0) {
  const q = questions[0];
  console.log("Question number:", q.number);
  console.log("Question prompt:", JSON.stringify(q.question));
  console.log("Options:", q.options);
  console.log("Correct Answer:", q.correctAnswer);
  console.log("Answer Text:", q.answerText);
  console.log("Explanation:", q.explanation);
  console.log("Confidence:", q.confidence);
  console.log("Status:", q.status);
}
