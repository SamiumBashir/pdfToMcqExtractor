import { NextRequest, NextResponse } from "next/server";
import { serverDocuments, serverJobs } from "@/lib/server-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = serverDocuments.find((d) => d.id === id || d._id === id);

  if (!doc) {
    return NextResponse.json(
      { success: false, error: `PDF document '${id}' not found.` },
      { status: 404 }
    );
  }

  const job = serverJobs.get(id) || {
    _id: `job-${id}`,
    documentId: id,
    status: doc.processingStatus,
    progress: doc.processingStatus === "completed" ? 100 : 0,
    currentStep: doc.processingStatus,
    startedAt: doc.createdAt,
  };

  return NextResponse.json({
    success: true,
    document: doc,
    job,
  });
}
