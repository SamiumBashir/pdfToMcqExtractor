import { jsPDF } from "jspdf";

export interface SamplePDFInfo {
  id: string;
  name: string;
  filename: string;
  description: string;
  badge: string;
  generate: () => Blob;
}

/**
 * Sample 1: Standard English Science & Tech Exam with Inline Answers
 */
export function generateEnglishInlineSample(): Blob {
  const doc = new jsPDF();
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("General Science & Technology Examination", 105, y, { align: "center" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Time: 30 Minutes | Total Marks: 50 | Set: A", 105, y, { align: "center" });
  y += 12;

  const questions = [
    {
      q: "1. What is the capital city of Bangladesh?",
      opts: ["A. Chittagong", "B. Dhaka", "C. Sylhet", "D. Rajshahi"],
      ans: "Answer: B",
    },
    {
      q: "2. Which planet in our solar system is known as the Red Planet?",
      opts: ["A. Venus", "B. Mars", "C. Jupiter", "D. Saturn"],
      ans: "Correct Answer: B",
    },
    {
      q: "3. What is the chemical formula of Water?",
      opts: ["(a) CO2", "(b) H2O", "(c) NaCl", "(d) CH4"],
      ans: "Ans: (b)",
    },
    {
      q: "4. Who is considered the father of modern Computer Science?",
      opts: ["A. Charles Babbage", "B. Alan Turing", "C. John von Neumann", "D. Ada Lovelace"],
      ans: "Answer: B",
    },
    {
      q: "5. What is the primary function of red blood cells in the human body?",
      opts: ["A. Fight infections", "B. Transport oxygen", "C. Clot blood", "D. Produce hormones"],
      ans: "Ans: B",
    },
  ];

  doc.setFontSize(10);
  for (const item of questions) {
    doc.setFont("helvetica", "bold");
    doc.text(item.q, 15, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    for (const opt of item.opts) {
      doc.text(`   ${opt}`, 15, y);
      y += 5;
    }

    doc.setFont("helvetica", "bolditalic");
    doc.text(`   ${item.ans}`, 15, y);
    y += 9;
  }

  return doc.output("blob");
}

/**
 * Sample 2: Competitive Exam with Separate Answer Key at the end
 */
export function generateEnglishSeparateKeySample(): Blob {
  const doc = new jsPDF();
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("National Aptitude Test - Model Paper", 105, y, { align: "center" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Candidate Instructions: Answer keys are located on Page 1 at the footer.", 105, y, {
    align: "center",
  });
  y += 12;

  const questions = [
    {
      q: "Q1. The unit of electrical resistance is:",
      opts: ["A. Volt", "B. Ampere", "C. Ohm", "D. Watt"],
    },
    {
      q: "Q2. Which organelle is known as the powerhouse of the cell?",
      opts: ["A. Nucleus", "B. Ribosome", "C. Mitochondria", "D. Golgi Apparatus"],
    },
    {
      q: "Q3. The Great Wall of China was primarily built to protect against:",
      opts: ["A. Romans", "B. Mongol invasions", "C. Greek forces", "D. Persian empire"],
    },
    {
      q: "Q4. In JavaScript, which operator checks both value and data type equality?",
      opts: ["A. ==", "B. ===", "C. =", "D. !="],
    },
  ];

  doc.setFontSize(10);
  for (const item of questions) {
    doc.setFont("helvetica", "bold");
    doc.text(item.q, 15, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    for (const opt of item.opts) {
      doc.text(`   ${opt}`, 15, y);
      y += 5;
    }
    y += 5;
  }

  // Answer Key Section
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Answer Key:", 15, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text("1-C    2-C    3-B    4-B", 15, y);

  return doc.output("blob");
}

/**
 * Sample 3: Bengali (বাংলা) BCS Examination Model Paper
 * (Using English standard romanized representation or Bengali unicode text)
 */
export function generateBengaliSample(): Blob {
  const doc = new jsPDF();
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Bangladesh Civil Service (BCS) Model Test", 105, y, { align: "center" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Subject: Bangladesh Affairs & General Knowledge", 105, y, { align: "center" });
  y += 12;

  // We can write Bengali or Bengali with Unicode or bilingual text
  const questions = [
    {
      q: "1. What is the national flower of Bangladesh? (National Emblem)",
      opts: ["A. Rose", "B. Water Lily (Shapla)", "C. Lotus", "D. Marigold"],
      ans: "Answer: B",
    },
    {
      q: "2. The historic Six-Point Demand was declared by Bangabandhu in which year?",
      opts: ["A. 1952", "B. 1966", "C. 1969", "D. 1971"],
      ans: "Answer: B",
    },
    {
      q: "3. Which river is the longest in Bangladesh?",
      opts: ["A. Padma", "B. Meghna", "C. Jamuna", "D. Surma"],
      ans: "Answer: D",
    },
    {
      q: "4. The Sundarbans was declared a UNESCO World Heritage Site in which year?",
      opts: ["A. 1991", "B. 1997", "C. 2001", "D. 2011"],
      ans: "Answer: B",
    },
  ];

  doc.setFontSize(10);
  for (const item of questions) {
    doc.setFont("helvetica", "bold");
    doc.text(item.q, 15, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    for (const opt of item.opts) {
      doc.text(`   ${opt}`, 15, y);
      y += 5;
    }

    doc.setFont("helvetica", "bolditalic");
    doc.text(`   ${item.ans}`, 15, y);
    y += 8;
  }

  return doc.output("blob");
}

export const SAMPLE_DATASETS: SamplePDFInfo[] = [
  {
    id: "english-inline",
    name: "General Science (Inline Answers)",
    filename: "sample-science-exam.pdf",
    description: "5 questions with format 'Answer: B', 'Ans: (b)'",
    badge: "Inline Keys",
    generate: generateEnglishInlineSample,
  },
  {
    id: "english-key",
    name: "Aptitude Test (Separate Key)",
    filename: "sample-aptitude-test.pdf",
    description: "4 questions with 'Answer Key: 1-C 2-C 3-B 4-B'",
    badge: "Answer Key",
    generate: generateEnglishSeparateKeySample,
  },
  {
    id: "bcs-model",
    name: "BCS Model Test (Bangladesh Affairs)",
    filename: "sample-bcs-exam.pdf",
    description: "General Knowledge & BCS questions with full options",
    badge: "BCS Exam",
    generate: generateBengaliSample,
  },
];
