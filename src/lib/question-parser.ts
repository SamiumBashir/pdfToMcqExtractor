import { MCQQuestion, ConfidenceLevel, QuestionStatus, QuestionVerificationStatus } from "@/types/question";
import {
  bengaliDigitsToEnglish,
  normalizeOptionKey,
  hasBengaliText,
  ROMAN_TO_BENGALI_OPTION_MAP,
} from "./text-normalizer";
import { extractInlineAnswer, parseAnswerKeySection } from "./answer-parser";
import { PageTextData } from "./pdf-parser";

interface RawQuestionBlock {
  rawNumber: string;
  number: number;
  blockText: string;
  pageNumber?: number;
}

/**
 * Detects whether a line represents irrelevant PDF noise conforming to Section 9:
 * - Book/chapter titles
 * - Headers / Footers
 * - Page numbers (e.g. Page 12, পৃষ্ঠা ১২, - 12 -)
 * - Copyright notices
 * - Author / Publisher lines
 * - Examination notices / instructions
 * - Web addresses & contact emails
 * - Decorative dividers
 */
export function isDocumentNoiseLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // 1. Page numbers: "Page 12", "পৃষ্ঠা ১২", "12 of 45", "- 12 -", "[12]", "12/50"
  if (/^(?:Page|পৃষ্ঠা|P\.)\s*[0-9০-৯]+(?:\s*(?:of|\/|-)\s*[0-9০-৯]+)?$/i.test(trimmed)) return true;
  if (/^[-–—\[(]\s*[0-9০-৯]+\s*[-–—\])]$/.test(trimmed)) return true;
  if (/^[0-9০-৯]+\s*(?:\/|of)\s*[0-9০-৯]+$/i.test(trimmed)) return true;

  // 2. Copyright and legal notices
  if (/(?:Copyright|All Rights Reserved|স্বত্ব সংরক্ষিত|©|\(c\))\s*[0-9০-৯]*/i.test(trimmed)) return true;

  // 3. Document / Chapter headers & Book titles
  if (/^(?:Chapter|অধ্যায়|অধ্যায়|Part|Unit|Section|খণ্ড|পরিচ্ছেদ)\s*[0-9০-৯ivx]+\b.*$/i.test(trimmed)) return true;

  // 4. Instructions / Exam Notices
  if (/^(?:Important\s*Notice|Instructions?|General\s*Instructions?|Note|বি\.দ্র\.|বিশেষ\s*দ্রষ্টব্য|নির্দেশনা|প্রার্থীদের\s*জন্য\s*নির্দেশনা)[:\-–—]?.*$/i.test(trimmed)) return true;
  if (/(?:Calculators|Mobile\s*phones|Electronic\s*devices)\s+are\s+not\s+allowed/i.test(trimmed)) return true;

  // 5. Author, publisher, contact, website info
  if (/^(?:Author|লেখক|সম্পাদক|প্রকাশক|প্রকাশনী|Publisher|Edited by|Feedback|Email|Website)\s*[:\-–—].*$/i.test(trimmed)) return true;
  if (/^(?:https?:\/\/|www\.)[^\s]+$/i.test(trimmed)) return true;

  // 6. Pure decorative line breaks: "---", "===", "***", "___"
  if (/^[-—_=*~#]{3,}$/.test(trimmed)) return true;

  return false;
}

/**
 * Cleans the extracted question prompt text by removing noise lines
 * while preserving multi-line question sentences.
 */
export function cleanQuestionText(text: string): string {
  if (!text) return "";
  const lines = text.split("\n");
  const filteredLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (isDocumentNoiseLine(trimmed)) continue;
    filteredLines.push(trimmed);
  }

  return filteredLines.join("\n").trim();
}

/**
 * Cleans option text by trimming noise, explanations, and extraneous footers.
 */
export function cleanOptionText(text: string): string {
  if (!text) return "";
  const lines = text.split("\n");
  const validParts: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Immediately truncate option at explanation markers, answer markers, or document noise
    if (
      /^(?:Explanation|ব্যাখ্যা|Description|Note|Notes|বি\.দ্র\.|Hints?|সমাধান|বযা\s*যা)\s*[:\-–—]?/i.test(trimmed) ||
      /^(?:(?:Answer|Ans|Correct\s*Answer|উত্তর|সঠিক\s*উত্তর|উঃ|উ:|উ\s*\.)\s*[:.\-–—]?\s*\(?[A-Ea-eক-ঙ1-5]\)?)/i.test(trimmed) ||
      isDocumentNoiseLine(trimmed)
    ) {
      break;
    }

    validParts.push(trimmed);
  }

  let cleaned = validParts.join(" ").replace(/\s+/g, " ").trim();

  // Strip any inline answer that may be trailing on the same line (e.g. "রশ্মিবিচ্ছুরণ উ. গ")
  cleaned = cleaned.replace(
    /\s*(?:(?:Answer|Ans|Correct\s*Answer|উত্তর|সঠিক\s*উত্তর|উঃ|উ:|উ\s*\.)\s*[:.\-–—]?\s*\(?[A-Ea-eক-ঙ1-5]\)?).*$/i,
    ""
  );

  // Strip any explanation that may be trailing on the same line
  cleaned = cleaned.replace(
    /\s*(?:(?:Explanation|ব্যাখ্যা|Description|Note|বি\.দ্র\.|Hints?|সমাধান|বযা\s*যা)\s*[:\-–—]?).*$/i,
    ""
  );

  return cleaned.trim();
}

/**
 * Extracts explanation block from a question text block and returns the cleaned text.
 * Matches:
 * "ব্যাখ্যা: ...", "Explanation: ...", "সমাধান: ...", "বি.দ্র. ...", "বলা যায়: ..."
 */
export function extractExplanation(blockText: string): {
  explanation?: string;
  cleanedText: string;
} {
  if (!blockText) return { cleanedText: "" };

  const explanationRegex =
    /(?:^|\s|\n)(?:(?:ব্যাখ্যা|Explanation|Description|সমাধান|বি\.দ্র\.|বযা\s*যা)\s*[:\-–—]?\s*)([\s\S]*)$/i;

  const match = blockText.match(explanationRegex);
  if (match && match.index !== undefined) {
    const explanation = match[1]?.trim();
    const cleanedText = blockText.slice(0, match.index).trim();
    return {
      explanation: explanation || undefined,
      cleanedText,
    };
  }

  return { cleanedText: blockText };
}

/**
 * Splits document text into individual raw question blocks based on question number patterns.
 */
export function splitIntoQuestionBlocks(
  pages: PageTextData[] | string
): RawQuestionBlock[] {
  // If string passed, treat as page 1
  const pageList: { pageNumber: number; text: string }[] =
    typeof pages === "string"
      ? [{ pageNumber: 1, text: pages }]
      : pages.map((p) => ({ pageNumber: p.pageNumber, text: p.text }));

  const blocks: RawQuestionBlock[] = [];

  // Match question start at the beginning of a line:
  // Examples:
  // "1. ", "1) ", "(1) ", "Q1. ", "Q.1: ", "Question 1: ", "Que 1 - "
  // "১। ", "১. ", "১) ", "(১) ", "প্রশ্ন ১: "
  const questionStartRegex =
    /^[ \t]*(?:(?:Question|Que|Item|Q|প্রশ্ন)\s*[:.\-–—]?\s*)?\(?([0-9]{1,4}|[০-৯]{1,4})\)?\s*([.:)\]।\-–—])(?:\s+|$)/im;

  let currentBlock: RawQuestionBlock | null = null;

  for (const page of pageList) {
    const lines = page.text.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Stop parsing if we hit an Answer Key / উত্তরমালা header
      if (
        /^[ \t]*(?:Answer\s*Key|Answers|Solutions|Exam\s*Key|উত্তরমালা|সমাধান|সঠিক\s*উত্তরসমূহ)\s*[:\-–—]?/i.test(
          line
        )
      ) {
        if (currentBlock) {
          blocks.push(currentBlock);
          currentBlock = null;
        }
        break;
      }

      const match = line.match(questionStartRegex);

      if (match) {
        const rawNum = match[1];
        const numVal = parseInt(bengaliDigitsToEnglish(rawNum), 10);

        // Sanity check: must be a positive integer <= 500
        if (!isNaN(numVal) && numVal > 0 && numVal <= 500) {
          // If we had a previous block, push it
          if (currentBlock) {
            blocks.push(currentBlock);
          }

          // Remainder of the first line without the question number prefix
          const lineRest = line.slice(match[0].length).trim();

          currentBlock = {
            rawNumber: rawNum,
            number: numVal,
            blockText: lineRest,
            pageNumber: page.pageNumber,
          };
          continue;
        }
      }

      // If we are currently inside a question block, append the line
      if (currentBlock) {
        if (currentBlock.blockText) {
          currentBlock.blockText += "\n" + line;
        } else {
          currentBlock.blockText = line;
        }
      }
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}

/**
 * Extracts question prompt and options from a question block text.
 */
export function extractQuestionAndOptions(
  blockText: string
): {
  questionText: string;
  options: Record<string, string>;
} {
  const options: Record<string, string> = {};

  // First extract any inline answer so it doesn't get merged into an option
  const { cleanedBlockText } = extractInlineAnswer(blockText);

  // We look for option markers in sequential order.
  // Standard sets:
  // Roman/English: A, B, C, D (and optionally E)
  // Bengali: ক, খ, গ, ঘ (and optionally ঙ)
  // Lowercase: a, b, c, d (and optionally e)
  // Numeric: (1), (2), (3), (4) or 1., 2., 3., 4.

  const optionMarkerRegex =
    /(?:^|\s|\n)(?:\(?([A-Ea-eক-ঙ1-5])\)|([A-Ea-eক-ঙ])\s*[.:)\]।\-–—])(?:\s+|$)/g;

  const matches: { key: string; rawMarker: string; index: number; length: number }[] = [];
  let m: RegExpExecArray | null;

  while ((m = optionMarkerRegex.exec(cleanedBlockText)) !== null) {
    const rawKey = m[1] || m[2];
    if (rawKey) {
      matches.push({
        key: normalizeOptionKey(rawKey),
        rawMarker: m[0],
        index: m.index,
        length: m[0].length,
      });
    }
  }

  // Filter matches to ensure they follow a plausible option sequence (e.g. A, B, C, D...)
  const validOptionOrder: string[] = ["A", "B", "C", "D", "E"];
  const sequenceMatches: typeof matches = [];
  let expectedIndex = 0;

  for (const match of matches) {
    if (match.key === validOptionOrder[expectedIndex]) {
      sequenceMatches.push(match);
      expectedIndex++;
      if (expectedIndex >= validOptionOrder.length) break;
    }
  }

  // If we found at least 2 sequential options (A and B or more)
  if (sequenceMatches.length >= 2) {
    const firstOption = sequenceMatches[0];
    const rawQuestionText = cleanedBlockText.slice(0, firstOption.index).trim();
    const questionText = cleanQuestionText(rawQuestionText);

    for (let i = 0; i < sequenceMatches.length; i++) {
      const current = sequenceMatches[i];
      const startContent = current.index + current.length;
      const endContent =
        i + 1 < sequenceMatches.length
          ? sequenceMatches[i + 1].index
          : cleanedBlockText.length;

      const optionContent = cleanedBlockText.slice(startContent, endContent);
      options[current.key] = cleanOptionText(optionContent);
    }

    return {
      questionText: questionText || cleanQuestionText(cleanedBlockText),
      options,
    };
  }

  // Fallback: If strict sequence was not found, try line-by-line inspection
  const lines = cleanedBlockText.split("\n");
  const fallbackOptions: Record<string, string> = {};
  const questionLines: string[] = [];
  let foundFirstOption = false;
  let currentKey: string | null = null;

  const lineOptionRegex = /^[ \t]*(?:\(?([A-Ea-eক-ঙ1-5])\)|([A-Ea-eক-ঙ])\s*[.:)\]।\-–—])\s*(.*)$/i;

  for (const line of lines) {
    const lineMatch = line.match(lineOptionRegex);
    if (lineMatch) {
      foundFirstOption = true;
      const rawKey = lineMatch[1] || lineMatch[2];
      currentKey = normalizeOptionKey(rawKey);
      fallbackOptions[currentKey] = lineMatch[3].trim();
    } else if (foundFirstOption && currentKey) {
      if (
        /^(?:Explanation|ব্যাখ্যা|Description|Note|Notes|বি\.দ্র\.|Hints?|সমাধান)\s*[:\-–—]/i.test(line.trim()) ||
        isDocumentNoiseLine(line.trim())
      ) {
        currentKey = null; // Stop accumulating into the option
      } else {
        fallbackOptions[currentKey] += " " + line.trim();
      }
    } else {
      if (!isDocumentNoiseLine(line.trim())) {
        questionLines.push(line);
      }
    }
  }

  if (Object.keys(fallbackOptions).length >= 2) {
    const cleanedFallback: Record<string, string> = {};
    for (const [k, v] of Object.entries(fallbackOptions)) {
      cleanedFallback[k] = cleanOptionText(v);
    }
    return {
      questionText: cleanQuestionText(questionLines.join("\n")),
      options: cleanedFallback,
    };
  }

  // If no options detected at all
  return {
    questionText: cleanQuestionText(cleanedBlockText),
    options: {},
  };
}

/**
 * Main parser entry point: takes raw pages/text and parses into structured MCQQuestion objects.
 */
export function parseMCQDocument(
  pages: PageTextData[] | string,
  fullText?: string
): MCQQuestion[] {
  const blocks = splitIntoQuestionBlocks(pages);

  // Compute full text for answer key parsing if not explicitly passed
  let docFullText = fullText || "";
  if (!docFullText) {
    if (typeof pages === "string") {
      docFullText = pages;
    } else if (Array.isArray(pages)) {
      docFullText = pages.map((p) => p.text).join("\n");
    }
  }

  // Parse standalone answer key section if present in the document
  const answerKeyMap = parseAnswerKeySection(docFullText);

  const questions: MCQQuestion[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const qNum = block.number || i + 1;

    // 1. Extract explanation so it doesn't pollute options or answer
    const { explanation, cleanedText: textWithoutExplanation } = extractExplanation(block.blockText);

    // 2. Extract inline answer if available
    const inlineAnsResult = extractInlineAnswer(textWithoutExplanation);

    // 3. Extract question text and options from the remaining clean text
    const { questionText, options } = extractQuestionAndOptions(inlineAnsResult.cleanedBlockText);

    // 4. Determine correct answer:
    // Priority: Inline answer in question block > Separate Answer Key section
    let answer = inlineAnsResult.correctAnswer;
    if (!answer && answerKeyMap.has(qNum)) {
      answer = answerKeyMap.get(qNum) || null;
    }

    // Normalize option keys to uppercase standard A, B, C, D
    const standardizedOptions: Record<string, string> = {};
    for (const [k, v] of Object.entries(options)) {
      const normKey = normalizeOptionKey(k);
      standardizedOptions[normKey] = v;
    }

    // Determine confidence and status conforming strictly to Section 11 & Section 44
    const optionCount = Object.keys(standardizedOptions).length;
    let confidence: ConfidenceLevel = "needs-review";
    let status: QuestionStatus = "needs_review";

    if (optionCount >= 4 && answer !== null && standardizedOptions[answer]) {
      confidence = "high";
      status = "answered";
    } else if (optionCount >= 3 && answer !== null) {
      confidence = "medium";
      status = "answered";
    } else if (answer === null) {
      confidence = "needs-review";
      status = "missing_answer";
    } else {
      confidence = "needs-review";
      status = "needs_review";
    }

    const verificationStatus: QuestionVerificationStatus =
      confidence === "high" && answer !== null ? "verified" : "review";

    const answerText =
      answer && standardizedOptions[answer] ? standardizedOptions[answer] : undefined;

    questions.push({
      id: `q-${qNum}-${Date.now()}-${i}`,
      number: qNum,
      rawNumber: block.rawNumber,
      question: questionText || `Question ${qNum}`,
      options: standardizedOptions,
      correctAnswer: answer,
      answerText,
      explanation,
      confidence,
      status,
      verificationStatus,
      pageNumber: block.pageNumber || 1,
    });
  }

  return questions;
}
