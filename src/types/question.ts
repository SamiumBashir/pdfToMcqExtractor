export type MCQOptionKey = "A" | "B" | "C" | "D" | "E" | "ক" | "খ" | "গ" | "ঘ" | "ঙ" | string;

export type ConfidenceLevel = "high" | "medium" | "needs-review";

export type QuestionStatus = "answered" | "missing_answer" | "needs_review";

export interface MCQQuestion {
  id: string;
  number: number | string;
  rawNumber?: string;
  question: string;
  options: Record<string, string>;
  correctAnswer: string | null;
  confidence: ConfidenceLevel;
  status: QuestionStatus;
  pageNumber?: number;
  explanation?: string;
  isEdited?: boolean;
}

export interface ExtractionStats {
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  needsReviewCount: number;
  totalPages: number;
  isOcrUsed: boolean;
}

export type ExtractionStep =
  | "idle"
  | "uploading"
  | "extracting"
  | "ocr"
  | "detecting_questions"
  | "detecting_options"
  | "detecting_answers"
  | "finalizing"
  | "completed"
  | "error";

export interface ExtractionProgress {
  step: ExtractionStep;
  message: string;
  percent: number;
  details?: string;
}

export interface ExtractionResponse {
  success: boolean;
  questions: MCQQuestion[];
  stats: ExtractionStats;
  rawText?: string;
  error?: string;
}
