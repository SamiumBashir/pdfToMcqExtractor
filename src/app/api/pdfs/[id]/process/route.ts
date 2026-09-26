import { NextRequest, NextResponse } from "next/server";
import { serverDocuments, serverJobs } from "@/lib/server-store";

export async function POST(
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

  doc.processingStatus = "processing";
  doc.updatedAt = new Date().toISOString();

  let job = serverJobs.get(id);
  if (!job) {
    job = {
      _id: `job-${Date.now()}`,
      documentId: id,
      status: "processing",
      progress: 10,
      currentStep: "extracting",
      startedAt: new Date().toISOString(),
    };
    serverJobs.set(id, job);
  } else {
    job.status = "processing";
    job.progress = 25;
    job.currentStep = "extracting";
  }

  return NextResponse.json({
    success: true,
    message: `Processing initiated for PDF document '${id}'.`,
    document: doc,
    job,
  });
}
