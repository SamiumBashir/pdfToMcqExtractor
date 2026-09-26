import { NextRequest, NextResponse } from "next/server";
import { bulkApproveQuestions } from "@/lib/server-store";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const ids: string[] = body.ids || [];

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Array of question 'ids' required for bulk approval." },
        { status: 400 }
      );
    }

    const count = bulkApproveQuestions(ids);

    return NextResponse.json({
      success: true,
      message: `Successfully approved ${count} questions.`,
      approvedCount: count,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to bulk approve questions." },
      { status: 500 }
    );
  }
}
