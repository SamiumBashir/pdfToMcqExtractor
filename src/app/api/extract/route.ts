import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF, PageTextData } from "@/lib/pdf-parser";
import { parseMCQDocument } from "@/lib/question-parser";
import { extractWithAI } from "@/lib/ai-extractor";
import { MCQQuestion, ExtractionStats } from "@/types/question";

export const maxDuration = 60; // Allow sufficient time for large PDFs

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let pages: PageTextData[] = [];
    let totalPages = 1;
    let fullText = "";
    let isScanned = false;
    let useAi = false;
    let apiKey: string | undefined = undefined;

    // Case 1: Client-extracted text sent as JSON (Supports 150MB+ PDFs without upload limit)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      pages = body.pages || [];
      totalPages = body.totalPages || (pages.length > 0 ? pages.length : 1);
      fullText = body.fullText || body.text || "";
      isScanned = body.isScanned || false;
      useAi = body.useAi === true || body.useAi === "true";
      apiKey = body.apiKey || undefined;

      if (!fullText && pages.length === 0) {
        return NextResponse.json(
          { success: false, error: "No extracted text received in JSON payload." },
          { status: 400 }
        );
      }
    } else {
      // Case 2: Binary multipart/form-data PDF upload
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const useAiParam = formData.get("useAi") as string | null;
      const apiKeyParam = formData.get("apiKey") as string | null;

      useAi = useAiParam === "true";
      apiKey = apiKeyParam || undefined;

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

      // Extract text from PDF
      const extractionResult = await extractTextFromPDF(arrayBuffer);

      if (!extractionResult.success) {
        return NextResponse.json(
          { success: false, error: extractionResult.error || "Failed to extract text from PDF." },
          { status: 422 }
        );
      }

      pages = extractionResult.pages;
      totalPages = extractionResult.totalPages;
      fullText = extractionResult.fullText;
      isScanned = extractionResult.isScanned;
    }

    let questions: MCQQuestion[] = [];

    // Parse questions: AI Layer or Deterministic Rule-Based Parser
    if (useAi && (apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY)) {
      try {
        questions = await extractWithAI(fullText, { apiKey });
      } catch (aiErr: unknown) {
        console.warn("AI extraction fallback triggered:", aiErr);
        questions = parseMCQDocument(pages, fullText);
      }
    } else {
      questions = parseMCQDocument(pages, fullText);
    }

    // Compute statistics
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
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred during extraction.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
