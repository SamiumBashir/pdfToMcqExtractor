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

  // Clean common page number artifacts
  cleaned = cleaned.replace(/^\s*(?:page|Page|পৃষ্ঠা)\s*[:.-]?\s*[\d০-৯]+(?:\s*(?:of|এর|\/)\s*[\d০-৯]+)?\s*$/gim, "");
  cleaned = cleaned.replace(/^\s*[-–—]\s*[\d০-৯]+\s*[-–—]\s*$/gm, "");

  // Compress 3+ consecutive newlines to 2 newlines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // Trim trailing whitespace on each line
  cleaned = cleaned
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // If text exhibits Bijoy font corruption signatures, apply heuristic repairs
  if (isScrambledBijoyText(cleaned)) {
    cleaned = repairMangledBengaliText(cleaned);
  }

  return cleaned.trim();
}

/**
 * Detects if extracted text exhibits broken Bijoy/ANSI font encoding patterns common in
 * Bangladeshi exam guidebooks (e.g. Job's Password, BCS Solution, MP3) when extracted
 * without proper CMap decoding.
 */
export function isScrambledBijoyText(text: string): boolean {
  if (!text) return false;

  const suspiciousPatterns = [
    /থকানরি/i,
    /যকোয়/i,
    /রবশ্ব/i,
    /রিবস/i,
    /রনউ/i,
    /জারসং/i,
    /সদি\s*দপ্তি/i,
    /প্রািীন/i,
    /শতয/i,
    /খলাকসা/i,
    /খলাকী/i,
    /বযা\s*যা/i,
    /🗲/,
    /\bউ\.\s*[ক-ঘA-D🗲]\s*বযা\s*যা/i,
  ];

  let matches = 0;
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      matches++;
    }
  }

  return matches >= 2;
}

/**
 * Heuristically repairs common broken Bijoy/ANSI Bengali word artifacts from legacy PDF fonts.
 */
export function repairMangledBengaliText(text: string): string {
  if (!text) return "";

  return text
    // Normalize corrupted glyphs
    .replace(/🗲/g, "গ")
    // Fix common corrupted phrases from Bijoy font mapping
    .replace(/থকানরি\s+শুদ্ধ\s+বাক্য\?/g, "কোনটি শুদ্ধ বাক্য?")
    .replace(/থকানরি/g, "কোনটি")
    .replace(/যকোয়/g, "কোথায়")
    .replace(/রবশ্ব/g, "বিশ্ব")
    .replace(/রিবস/g, "দিবস")
    .replace(/রনউইয়কড/g, "নিউইয়র্ক")
    .replace(/জারসংঘমি/g, "জাতিসংঘের")
    .replace(/জারসংঘের/g, "জাতিসংঘের")
    .replace(/জারসংঘ/g, "জাতিসংঘ")
    .replace(/সদি\s+দপ্তি/g, "সদর দপ্তর")
    .replace(/সদি/g, "সদর")
    .replace(/দপ্তি/g, "দপ্তর")
    .replace(/খলাকসারহশতযর/g, "লোকসাহিত্যের")
    .replace(/খলাকসারহত্য/g, "লোকসাহিত্য")
    .replace(/প্রািীনতম/g, "প্রাচীনতম")
    .replace(/প্রািীন/g, "প্রাচীন")
    .replace(/রনেন্থন/g, "নিদর্শন")
    .replace(/খলাকীরত/g, "লোকগীতি")
    .replace(/রেভিয়ান/g, "জারিগান")
    .replace(/রেড়িয়ান/g, "জারিগান")
    .replace(/বযা\s*যা\s*:/g, "বলা যায়:")
    .replace(/বযা\s*যা/g, "বলা যায়")
    .replace(/স\s*ূত্র\s*০ঃ/g, "সূত্র:")
    .replace(/স\s*ূত্র/g, "সূত্র")
    .replace(/বইময়ি/g, "বইয়ের")
    .replace(/পৃষ্ঠ\s*া/g, "পৃষ্ঠা")
    .replace(/ধশমথর/g, "গ্রীষ্মের")
    .replace(/কষ্ণো/g, "কৃষ্ণ")
    .replace(/বাতাপস/g, "বাতাসে")
    .replace(/নশি/g, "নাশি")
    .replace(/খতল/g, "খেলে")
    .replace(/পাওয়া\s*র\s*ীয়/g, "পাওয়ার যোগ্য")
    .replace(/আন্তজযারতক/g, "আন্তর্জাতিক")
    .replace(/রবশরাসংঘ/g, "বিশ্বসংঘ")
    .replace(/রপ্নর\s*০/g, "নম্বর")
    .replace(/রনেন্ধন/g, "নিবন্ধন")
    .replace(/অ\s*নুষঙ্গ/g, "অনুষঙ্গ");
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
