import { MCQQuestion, ConfidenceLevel, QuestionStatus } from "@/types/question";
import { normalizeOptionKey } from "./text-normalizer";

export interface AIExtractionOptions {
  apiKey?: string;
  provider?: "gemini" | "openai";
}

interface RawAIQuestion {
  number: number | string;
  question: string;
  options: Record<string, string>;
  correctAnswer?: string | null;
  explanation?: string;
}

const AI_SYSTEM_PROMPT = `
You are an expert examination paper parser specialized in extracting Multiple Choice Questions (MCQs) from raw document text in English, Bengali (বাংলা), or mixed languages.

RULES:
1. Extract every individual question with its options (A, B, C, D, and E if present).
2. For Bengali papers, transcribe the exact Bengali text faithfully without translating.
3. Map Bengali option labels (ক, খ, গ, ঘ, ঙ) to standard keys "A", "B", "C", "D", "E" or retain both.
4. Extract the correct answer ONLY if it is explicitly stated in an inline answer (e.g., "Answer: B", "Ans: (b)", "উত্তর: খ") or in an Answer Key section at the bottom (e.g., "1-B, 2-C").
5. CRITICAL: NEVER hallucinate or invent an answer. If the answer is not explicitly written in the document text, you MUST set "correctAnswer" to null.
6. Return a valid JSON array of objects conforming to the specified schema. No markdown formatting, no conversational text.
`;

/**
 * Extracts MCQs using Gemini API.
 */
async function extractWithGemini(
  text: string,
  apiKey: string
): Promise<MCQQuestion[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${AI_SYSTEM_PROMPT}\n\nDocument Text:\n"""\n${text}\n"""\n\nReturn strict JSON array with fields: number (integer), question (string), options (object with keys A, B, C, D), correctAnswer (string or null).`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawContent =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

  return parseAndValidateAIResponse(rawContent);
}

/**
 * Extracts MCQs using OpenAI API format.
 */
async function extractWithOpenAI(
  text: string,
  apiKey: string
): Promise<MCQQuestion[]> {
  const url = "https://api.openai.com/v1/chat/completions";

  const requestBody = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: AI_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Document Text:\n"""\n${text}\n"""\n\nExtract all MCQs into a JSON array with fields: number, question, options (keys A, B, C, D), correctAnswer (or null).`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || "[]";

  return parseAndValidateAIResponse(rawContent);
}

/**
 * Parses raw JSON string from AI model and converts to typed MCQQuestion array.
 */
export function parseAndValidateAIResponse(rawJson: string): MCQQuestion[] {
  let parsed: unknown;
  try {
    // Strip markdown code block if present
    const cleaned = rawJson.replace(/```json/gi, "").replace(/```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error("Failed to parse JSON response from AI model.");
  }

  // Handle case where root object has a "questions" property
  let items: RawAIQuestion[] = [];
  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (parsed && typeof parsed === "object" && "questions" in parsed && Array.isArray((parsed as { questions: unknown[] }).questions)) {
    items = (parsed as { questions: RawAIQuestion[] }).questions;
  } else {
    throw new Error("AI response did not contain a valid array of questions.");
  }

  const result: MCQQuestion[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.question) continue;

    const qNum = typeof item.number === "number" ? item.number : parseInt(String(item.number), 10) || i + 1;
    const rawOptions = item.options || {};
    const standardizedOptions: Record<string, string> = {};

    for (const [k, v] of Object.entries(rawOptions)) {
      const normKey = normalizeOptionKey(k);
      standardizedOptions[normKey] = String(v).trim();
    }

    let answer = item.correctAnswer ? normalizeOptionKey(String(item.correctAnswer)) : null;
    if (answer && answer.toLowerCase() === "unknown" || answer === "null") {
      answer = null;
    }

    const optCount = Object.keys(standardizedOptions).length;
    let confidence: ConfidenceLevel = "needs-review";
    let status: QuestionStatus = "needs_review";

    if (optCount >= 4 && answer && standardizedOptions[answer]) {
      confidence = "high";
      status = "answered";
    } else if (optCount >= 3 && answer) {
      confidence = "medium";
      status = "answered";
    } else if (optCount >= 3 && !answer) {
      confidence = "needs-review";
      status = "missing_answer";
    }

    result.push({
      id: `ai-q-${qNum}-${Date.now()}-${i}`,
      number: qNum,
      question: String(item.question).trim(),
      options: standardizedOptions,
      correctAnswer: answer,
      confidence,
      status,
      explanation: item.explanation,
      pageNumber: 1,
    });
  }

  return result;
}

/**
 * Dispatches AI extraction to available provider.
 */
export async function extractWithAI(
  text: string,
  options?: AIExtractionOptions
): Promise<MCQQuestion[]> {
  const geminiKey = options?.apiKey || process.env.GEMINI_API_KEY;
  const openAiKey = options?.apiKey || process.env.OPENAI_API_KEY;

  if (geminiKey) {
    return extractWithGemini(text, geminiKey);
  }

  if (openAiKey) {
    return extractWithOpenAI(text, openAiKey);
  }

  throw new Error(
    "No AI API key found. Please set GEMINI_API_KEY or OPENAI_API_KEY in your environment, or provide an API key in extraction settings."
  );
}
