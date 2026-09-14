import {
  bengaliDigitsToEnglish,
  normalizeOptionKey,
} from "./text-normalizer";

export interface ParsedAnswerResult {
  correctAnswer: string | null;
  rawAnswerText?: string;
  cleanedBlockText: string;
}

/**
 * Extracts inline answer from a single question text block.
 * Returns the detected answer (normalized e.g. "A", "B", "C", "D", "E")
 * and the cleaned text block with the answer line removed.
 */
export function extractInlineAnswer(blockText: string): ParsedAnswerResult {
  if (!blockText) {
    return { correctAnswer: null, cleanedBlockText: "" };
  }

  // Answer markers with strict boundaries to avoid false positives:
  // English: Answer: B, Ans: (b), Correct Answer: C, Ans.- A, Solution: B, Key: D
  // Bengali: উত্তর: ক, সঠিক উত্তর: (খ), উ:, উঃ খ
  const answerRegex =
    /(?:(?:\b(?:Correct\s*Answer|Answer|Ans\.?|Solution|Exam\s*Key|Key)\b|(?:^|\s|\n)(?:সঠিক\s*উত্তর|উত্তর|উঃ|উ:))\s*[:.\-–—]?\s*)(?:\(?([A-Ea-eক-ঙ1-5])\)?|([A-Ea-e1-5])\b|([ক-ঙ]))/i;

  const match = blockText.match(answerRegex);

  if (match) {
    const rawKey = match[1] || match[2] || match[3];
    if (rawKey) {
      const normalizedKey = normalizeOptionKey(rawKey);

      // Remove the answer line/segment from the question block
      const cleaned = blockText.replace(match[0], "").trim();

      return {
        correctAnswer: normalizedKey,
        rawAnswerText: match[0].trim(),
        cleanedBlockText: cleaned,
      };
    }
  }

  return {
    correctAnswer: null,
    cleanedBlockText: blockText,
  };
}

/**
 * Parses a standalone "Answer Key" section usually located at the end of the document.
 * Examples:
 * "Answer Key: 1. B 2. C 3. A 4. D"
 * "1-B, 2-C, 3-A, 4-D"
 * "১. খ ২. গ ৩. ক ৪. ঘ"
 * "Answers:\n1: B\n2: C\n3: A"
 */
export function parseAnswerKeySection(fullText: string): Map<number, string> {
  const answerMap = new Map<number, string>();
  if (!fullText) return answerMap;

  // Find where answer key section starts
  const answerKeyHeaderRegex =
    /(?:(?:^|\n)\s*(?:Answer\s*Keys?|Answers?|Solutions?|Exam\s*Key|উত্তরমালা|সমাধান|সঠিক\s*উত্তরসমূহ)\s*[:\-–—]?)/i;

  const headerMatch = fullText.match(answerKeyHeaderRegex);
  if (!headerMatch || headerMatch.index === undefined) {
    return answerMap;
  }

  // Extract all text following the answer key header
  const answerKeyText = fullText.slice(headerMatch.index);

  // Pattern for matches: QuestionNumber + Delimiter + AnswerOption
  // e.g. "1. B", "1-B", "1: B", "1 B", "১. খ", "১ - খ", "(1) B", "[1] (C)"
  const itemPattern =
    /(?:\(?([0-9]{1,4}|[০-৯]{1,4})\)?\s*[:.\-–—)]?\s*\(?([A-Ea-eক-ঙ1-5])\)?)/g;

  let m: RegExpExecArray | null;
  while ((m = itemPattern.exec(answerKeyText)) !== null) {
    const rawNumStr = m[1];
    const rawOption = m[2];

    const qNum = parseInt(bengaliDigitsToEnglish(rawNumStr), 10);
    const normalizedOpt = normalizeOptionKey(rawOption);

    if (!isNaN(qNum) && normalizedOpt && !answerMap.has(qNum)) {
      answerMap.set(qNum, normalizedOpt);
    }
  }

  return answerMap;
}
