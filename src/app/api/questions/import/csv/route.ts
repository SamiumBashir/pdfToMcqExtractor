import { NextRequest, NextResponse } from "next/server";
import { importFromStandardCSV } from "@/lib/csv-manager";
import { serverQuestions } from "@/lib/server-store";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let csvText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, error: "No CSV file provided in 'file' field." },
          { status: 400 }
        );
      }
      csvText = await file.text();
    } else {
      // Direct raw text or json payload
      const text = await req.text();
      try {
        const json = JSON.parse(text);
        csvText = json.csv || json.content || text;
      } catch {
        csvText = text;
      }
    }

    if (!csvText.trim()) {
      return NextResponse.json(
        { success: false, error: "Empty CSV content received." },
        { status: 400 }
      );
    }

    const result = importFromStandardCSV(csvText);

    // Persist valid questions into server question bank
    if (result.validQuestions.length > 0) {
      serverQuestions.unshift(...result.validQuestions);
    }

    return NextResponse.json({
      success: true,
      totalRows: result.totalRows,
      validRows: result.validCount,
      invalidRows: result.invalidCount,
      duplicateRows: result.duplicateCount,
      invalidDetails: result.invalidRows,
      importedQuestions: result.validQuestions,
      message: `Successfully imported ${result.validCount} valid questions.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process CSV import." },
      { status: 500 }
    );
  }
}
