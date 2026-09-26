import { StructuredQuestion, DocumentRecord, ExtractionJobRecord } from "@/types/question";

// Global server memory store singleton across API invocations in development/runtime
declare global {
  var __SERVER_QUESTIONS__: StructuredQuestion[] | undefined;
  var __SERVER_DOCUMENTS__: DocumentRecord[] | undefined;
  var __SERVER_JOBS__: Map<string, ExtractionJobRecord> | undefined;
}

if (!global.__SERVER_QUESTIONS__) {
  global.__SERVER_QUESTIONS__ = [];
}

if (!global.__SERVER_DOCUMENTS__) {
  global.__SERVER_DOCUMENTS__ = [];
}

if (!global.__SERVER_JOBS__) {
  global.__SERVER_JOBS__ = new Map<string, ExtractionJobRecord>();
}

export const serverQuestions = global.__SERVER_QUESTIONS__;
export const serverDocuments = global.__SERVER_DOCUMENTS__;
export const serverJobs = global.__SERVER_JOBS__;

export function findQuestionById(id: string): StructuredQuestion | undefined {
  return serverQuestions.find((q) => q.id === id || q._id === id);
}

export function updateQuestionById(
  id: string,
  updates: Partial<StructuredQuestion>
): StructuredQuestion | null {
  const index = serverQuestions.findIndex((q) => q.id === id || q._id === id);
  if (index === -1) return null;

  serverQuestions[index] = {
    ...serverQuestions[index],
    ...updates,
    updatedAt: new Date().toISOString(),
    isEdited: true,
  };
  return serverQuestions[index];
}

export function deleteQuestionById(id: string): boolean {
  const index = serverQuestions.findIndex((q) => q.id === id || q._id === id);
  if (index === -1) return false;
  serverQuestions.splice(index, 1);
  return true;
}

export function approveQuestionById(id: string): StructuredQuestion | null {
  return updateQuestionById(id, {
    status: "verified",
  });
}

export function bulkApproveQuestions(ids: string[]): number {
  let count = 0;
  for (const id of ids) {
    if (approveQuestionById(id)) {
      count++;
    }
  }
  return count;
}
