import { NextRequest, NextResponse } from "next/server";
import { performOcr } from "@/lib/ocr";
import { parseMCQDocument } from "@/lib/question-parser";
import { MCQQuestion, ExtractionStats } from "@/types/question";

export const maxDuration = 120; // OCR on multiple images can take time

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const lang = (formData.get("lang") as string) || "eng+ben";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided for OCR." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const extractedText = await performOcr(arrayBuffer, lang);

    const questions: MCQQuestion[] = parseMCQDocument(
      [{ pageNumber: 1, text: extractedText, charCount: extractedText.length }],
      extractedText
    );

    const stats: ExtractionStats = {
      totalQuestions: questions.length,
      answeredCount: questions.filter((q) => q.status === "answered").length,
      unansweredCount: questions.filter((q) => q.status === "missing_answer").length,
      needsReviewCount: questions.filter((q) => q.confidence === "needs-review").length,
      totalPages: 1,
      isOcrUsed: true,
    };

    return NextResponse.json({
      success: true,
      text: extractedText,
      questions,
      stats,
    });
  } catch (err: unknown) {
    console.error("OCR API error:", err);
    const msg = err instanceof Error ? err.message : "OCR processing failed.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
