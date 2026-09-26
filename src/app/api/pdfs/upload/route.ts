import { NextRequest, NextResponse } from "next/server";
import { serverDocuments, serverJobs } from "@/lib/server-store";
import { DocumentRecord, ExtractionJobRecord } from "@/types/question";

const DEFAULT_MAX_SIZE = 150 * 1024 * 1024; // 150MB

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, error: "Invalid Content-Type. Expected multipart/form-data." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No PDF file provided in 'file' field." },
        { status: 400 }
      );
    }

    // 1. Validate File Extension & MIME
    const originalName = file.name || "document.pdf";
    if (!originalName.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, error: "Unsupported file type. Only PDF documents are supported." },
        { status: 400 }
      );
    }

    // 2. Validate File Size
    const envMaxSize = process.env.MAX_FILE_SIZE
      ? parseInt(process.env.MAX_FILE_SIZE, 10)
      : DEFAULT_MAX_SIZE;
    if (file.size > envMaxSize) {
      const maxMb = Math.round(envMaxSize / (1024 * 1024));
      return NextResponse.json(
        { success: false, error: `File size exceeds the maximum limit of ${maxMb} MB.` },
        { status: 413 }
      );
    }

    // 3. Create document record conforming to Section 21
    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const docRecord: DocumentRecord = {
      _id: docId,
      id: docId,
      fileName: originalName,
      fileSize: file.size,
      pageCount: 0,
      pdfType: "text",
      processingStatus: "uploaded",
      questionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    serverDocuments.unshift(docRecord);

    // 4. Initialize extraction job record
    const jobRecord: ExtractionJobRecord = {
      _id: `job-${Date.now()}`,
      documentId: docId,
      status: "pending",
      progress: 0,
      currentStep: "uploaded",
      startedAt: new Date().toISOString(),
    };
    serverJobs.set(docId, jobRecord);

    return NextResponse.json({
      success: true,
      message: "PDF uploaded successfully.",
      document: docRecord,
      jobId: jobRecord._id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to handle PDF upload." },
      { status: 500 }
    );
  }
}
