import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF } from "@/lib/pdf-parser";
import { parseMCQDocument } from "@/lib/question-parser";
import { extractWithAI } from "@/lib/ai-extractor";
import { MCQQuestion, ExtractionStats } from "@/types/question";

export const maxDuration = 60; // Allow sufficient time for large PDFs

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const useAiParam = formData.get("useAi") as string | null;
    const apiKeyParam = formData.get("apiKey") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No PDF file provided. Please select a PDF file to upload." },
        { status: 400 }
      );
    }

    // Validate MIME type and extension
    const isPdfMime = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfMime) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only PDF documents (.pdf) are supported." },
        { status: 400 }
      );
    }

    // Limit size to 150MB
    const MAX_FILE_SIZE = 150 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). The maximum allowed size is 150MB.`,
        },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: "The uploaded PDF file is empty (0 bytes)." },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();

    // 1. Extract text from PDF
    const extractionResult = await extractTextFromPDF(arrayBuffer);

    if (!extractionResult.success) {
      return NextResponse.json(
        { success: false, error: extractionResult.error || "Failed to extract text from PDF." },
        { status: 422 }
      );
    }

    const { pages, totalPages, fullText, isScanned } = extractionResult;

    let questions: MCQQuestion[] = [];
    const useAi = useAiParam === "true";

    // 2. Parse questions
    if (useAi && (apiKeyParam || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY)) {
      try {
        questions = await extractWithAI(fullText, { apiKey: apiKeyParam || undefined });
      } catch (aiErr: unknown) {
        console.warn("AI extraction fallback triggered:", aiErr);
        // Fallback to rule-based parser if AI encounters rate limits or errors
        questions = parseMCQDocument(pages, fullText);
      }
    } else {
      questions = parseMCQDocument(pages, fullText);
    }

    // 3. Compute statistics
    const totalQuestions = questions.length;
    const answeredCount = questions.filter((q) => q.status === "answered").length;
    const unansweredCount = questions.filter((q) => q.status === "missing_answer").length;
    const needsReviewCount = questions.filter((q) => q.confidence === "needs-review").length;

    const stats: ExtractionStats = {
      totalQuestions,
      answeredCount,
      unansweredCount,
      needsReviewCount,
      totalPages,
      isOcrUsed: isScanned,
    };

    return NextResponse.json({
      success: true,
      questions,
      stats,
      rawText: fullText.slice(0, 10000), // Preview sample of text
      isScanned,
    });
  } catch (err: unknown) {
    console.error("Extraction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred during extraction.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
