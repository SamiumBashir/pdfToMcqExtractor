import {
  generateEnglishInlineSample,
  generateEnglishSeparateKeySample,
  generateBengaliSample,
} from "../src/lib/samples";

async function testSample(name: string, blob: Blob) {
  console.log(`\nTesting sample: ${name}...`);
  const formData = new FormData();
  formData.append("file", blob, `${name}.pdf`);
  formData.append("useAi", "false");
  formData.append("useOcr", "auto");

  const response = await fetch("http://localhost:3000/api/extract", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  console.log(`[${name}] Status:`, response.status, "Success:", data.success);
  console.log(`[${name}] Total Questions:`, data.questions?.length);
  console.log(`[${name}] Stats:`, data.stats);

  if (data.questions) {
    data.questions.forEach((q: any) => {
      console.log(`  Q${q.number}: "${q.question}" -> Ans: ${q.correctAnswer} (${q.confidence})`);
    });
  }

  if (!data.success || !data.questions || data.questions.length === 0) {
    throw new Error(`Failed to extract questions from ${name}`);
  }
}

async function runAll() {
  await testSample("English-Inline-Sample", generateEnglishInlineSample());
  await testSample("English-SeparateKey-Sample", generateEnglishSeparateKeySample());
  await testSample("Bengali-BCS-Sample", generateBengaliSample());
  console.log("\nALL 3 SAMPLE PAPERS PASSED E2E EXTRACTION!");
}

runAll().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
