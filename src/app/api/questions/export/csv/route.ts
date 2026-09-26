import { NextRequest, NextResponse } from "next/server";
import { exportToStandardCSV } from "@/lib/csv-manager";
import { StructuredQuestion } from "@/types/question";

export async function GET(req: NextRequest) {
  // If questions are sent as query or retrieved from server
  const csvContent = exportToStandardCSV([]);

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="questions-export.csv"',
    },
  });
}
