/**
 * Text normalization utilities for English and Bengali MCQ documents.
 */

// Bengali to English digit mapping
export const BENGALI_TO_ENGLISH_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

// English to Bengali digit mapping
export const ENGLISH_TO_BENGALI_DIGITS: Record<string, string> = {
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
};

// Bengali option letters to standard Roman option letters
export const BENGALI_OPTION_MAP: Record<string, string> = {
  "ক": "A",
  "খ": "B",
  "গ": "C",
  "ঘ": "D",
  "ঙ": "E",
};

export const ROMAN_TO_BENGALI_OPTION_MAP: Record<string, string> = {
  "A": "ক",
  "B": "খ",
  "C": "গ",
  "D": "ঘ",
  "E": "ঙ",
};

/**
 * Converts Bengali digits string to English number string.
 * Example: "১২" -> "12"
 */
export function bengaliDigitsToEnglish(str: string): string {
  if (!str) return "";
  return str.replace(/[০-৯]/g, (match) => BENGALI_TO_ENGLISH_DIGITS[match] || match);
}

/**
 * Converts English number string to Bengali digits string.
 * Example: "12" -> "১২"
 */
export function englishDigitsToBengali(str: string): string {
  if (!str) return "";
  return str.replace(/[0-9]/g, (match) => ENGLISH_TO_BENGALI_DIGITS[match] || match);
}

/**
 * Checks if a string contains Bengali script characters.
 */
export function hasBengaliText(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

/**
 * Normalizes text extracted from PDF:
 * - Replaces non-standard whitespace and control chars
 * - Normalizes quotes and dashes
 * - Cleans repetitive headers/footers
 * - Normalizes line breaks
 */
export function normalizeExtractedText(text: string): string {
  if (!text) return "";

  let cleaned = text
    // Replace non-breaking spaces and zero-width spaces
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ")
    // Normalize quotes
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // Normalize dashes
    .replace(/[\u2013\u2014\u2015]/g, "-")
    // Normalize bullet points to dashes
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, "-")
    // Fix carriage returns
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  // Remove common page number artifacts like "Page 1 of 12" or "- 1 -" or "Page 1"
  cleaned = cleaned.replace(/^\s*(?:page|Page|পৃষ্ঠা)\s*[:.-]?\s*[\d০-৯]+(?:\s*(?:of|এর|\/)\s*[\d০-৯]+)?\s*$/gim, "");
  cleaned = cleaned.replace(/^\s*[-–—]\s*[\d০-৯]+\s*[-–—]\s*$/gm, "");

  // Compress 3+ consecutive newlines to 2 newlines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // Trim trailing whitespace on each line
  cleaned = cleaned
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  return cleaned.trim();
}

/**
 * Maps any option key (e.g. "a", "1", "ক", "(b)") to normalized uppercase key "A", "B", "C", "D", "E".
 */
export function normalizeOptionKey(key: string): string {
  if (!key) return "";
  const cleaned = key.trim().replace(/[().:[\]\-–—]/g, "");

  // Check Bengali mapping
  if (BENGALI_OPTION_MAP[cleaned]) {
    return BENGALI_OPTION_MAP[cleaned];
  }

  // Check numeric 1->A, 2->B, 3->C, 4->D
  const englishNum = bengaliDigitsToEnglish(cleaned);
  if (englishNum === "1") return "A";
  if (englishNum === "2") return "B";
  if (englishNum === "3") return "C";
  if (englishNum === "4") return "D";
  if (englishNum === "5") return "E";

  const upper = cleaned.toUpperCase();
  if (["A", "B", "C", "D", "E"].includes(upper)) {
    return upper;
  }

  return cleaned;
}
