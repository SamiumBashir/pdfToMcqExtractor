import { NextRequest, NextResponse } from "next/server";
import {
  findQuestionById,
  updateQuestionById,
  deleteQuestionById,
} from "@/lib/server-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const question = findQuestionById(id);

  if (!question) {
    return NextResponse.json(
      { success: false, error: `Question with id '${id}' not found.` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: question,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = updateQuestionById(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Question with id '${id}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Question updated successfully.",
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update question." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteQuestionById(id);

  if (!deleted) {
    return NextResponse.json(
      { success: false, error: `Question with id '${id}' not found.` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Question '${id}' deleted successfully.`,
  });
}
