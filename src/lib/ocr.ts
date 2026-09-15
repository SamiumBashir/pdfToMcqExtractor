import { createWorker } from "tesseract.js";
import { normalizeExtractedText } from "./text-normalizer";

export interface OCRProgressCallback {
  (progress: { status: string; progress: number }): void;
}

/**
 * Performs OCR on an image buffer or base64 data string using Tesseract.js.
 * Supports both English ('eng') and Bengali ('ben') or combined ('eng+ben').
 */
export async function performOcr(
  imageSource: Buffer | ArrayBuffer | string,
  lang: string = "eng+ben",
  onProgress?: OCRProgressCallback
): Promise<string> {
  const worker = await createWorker(lang, 1, {
    logger: (m) => {
      if (onProgress && m.status && typeof m.progress === "number") {
        onProgress({ status: m.status, progress: m.progress });
      }
    },
  });

  try {
    const ret = await worker.recognize(
      imageSource instanceof ArrayBuffer ? Buffer.from(imageSource) : imageSource
    );
    const rawText = ret.data.text || "";
    return normalizeExtractedText(rawText);
  } finally {
    await worker.terminate();
  }
}
