import { NextRequest, NextResponse } from "next/server";
import { serverQuestions } from "@/lib/server-store";
import { StructuredQuestion } from "@/types/question";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    let filtered = [...serverQuestions];

    if (search) {
      filtered = filtered.filter(
        (q) =>
          q.question.text.toLowerCase().includes(search) ||
          q.options.some((o) => o.text.toLowerCase().includes(search)) ||
          q.answer?.text.toLowerCase().includes(search)
      );
    }

    if (status && status !== "all") {
      filtered = filtered.filter((q) => q.status === status);
    }

    if (category && category !== "all") {
      filtered = filtered.filter((q) => q.category === category);
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      data: paginated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (Array.isArray(body)) {
      for (const item of body) {
        serverQuestions.unshift(item);
      }
      return NextResponse.json({
        success: true,
        message: `Successfully synchronized ${body.length} questions.`,
        total: serverQuestions.length,
      });
    }

    if (!body.question || !body.options) {
      return NextResponse.json(
        { success: false, error: "Invalid question schema: 'question' and 'options' required." },
        { status: 400 }
      );
    }

    const newQuestion: StructuredQuestion = {
      _id: body._id || body.id || `q-${Date.now()}`,
      id: body.id || body._id || `q-${Date.now()}`,
      questionNumber: body.questionNumber || serverQuestions.length + 1,
      question: typeof body.question === "string" ? { text: body.question } : body.question,
      options: Array.isArray(body.options) ? body.options : [],
      answer: body.answer || null,
      source: body.source || { documentId: "manual", pageNumber: 1 },
      confidence: body.confidence || {
        question: 1,
        options: 1,
        answer: 1,
        overall: 1,
        level: "high",
      },
      status: body.status || "verified",
      category: body.category || "General",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    serverQuestions.unshift(newQuestion);
    return NextResponse.json({
      success: true,
      message: "Question added successfully.",
      data: newQuestion,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process question creation" },
      { status: 500 }
    );
  }
}
