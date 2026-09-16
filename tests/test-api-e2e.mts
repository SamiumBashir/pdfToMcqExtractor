import { jsPDF } from "jspdf";

async function testApiExtraction() {
  console.log("=== Testing API: POST /api/extract ===");

  // 1. Generate test PDF in memory
  const doc = new jsPDF();
  doc.setFont("helvetica", "bold");
  doc.text("General Science Model Exam", 10, 10);
  doc.text("1. What is the capital of Bangladesh?", 10, 20);
  doc.text("A. Chittagong", 10, 28);
  doc.text("B. Dhaka", 10, 36);
  doc.text("C. Sylhet", 10, 44);
  doc.text("D. Rajshahi", 10, 52);
  doc.text("Answer: B", 10, 60);

  doc.text("2. What is 2 + 2?", 10, 75);
  doc.text("(a) 3", 10, 83);
  doc.text("(b) 4", 10, 91);
  doc.text("(c) 5", 10, 99);
  doc.text("(d) 6", 10, 107);
  doc.text("Correct Answer: (b)", 10, 115);

  const arrayBuffer = doc.output("arraybuffer");
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });

  const formData = new FormData();
  formData.append("file", blob, "test-exam.pdf");
  formData.append("useAi", "false");
  formData.append("useOcr", "auto");

  const response = await fetch("http://localhost:3000/api/extract", {
    method: "POST",
    body: formData,
  });

  console.log("Response status:", response.status, response.statusText);
  const data = await response.json();
  console.log("Response body:", data);
  console.log("Total Questions Extracted:", data.questions?.length);
  console.log("Stats:", data.stats);

  if (data.questions && data.questions.length > 0) {
    data.questions.forEach((q: any) => {
      console.log(`Q${q.number}: "${q.question}"`);
      console.log(" Options:", q.options);
      console.log(` Answer: ${q.correctAnswer} (Confidence: ${q.confidence}, Status: ${q.status})`);
    });
  }

  if (!data.success || data.questions.length !== 2) {
    console.error("Test failed: expected 2 questions");
    process.exit(1);
  }

  console.log("=== API E2E Test Passed Successfully! ===");
}

testApiExtraction().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
