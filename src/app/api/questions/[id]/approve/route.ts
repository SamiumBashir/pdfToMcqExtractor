import { NextRequest, NextResponse } from "next/server";
import { approveQuestionById } from "@/lib/server-store";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const approved = approveQuestionById(id);

  if (!approved) {
    return NextResponse.json(
      { success: false, error: `Question with id '${id}' not found.` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Question '${id}' has been approved and moved to Question Bank.`,
    data: approved,
  });
}
