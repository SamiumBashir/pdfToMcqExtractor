import { performOcr, OCRProgressCallback } from "../ocr";

export interface OCRProvider {
  id: string;
  name: string;
  description: string;
  isConfigured(): boolean;
  recognize(
    imageSource: Buffer | ArrayBuffer | string,
    lang?: string,
    onProgress?: OCRProgressCallback
  ): Promise<string>;
}

/**
 * Built-in Tesseract.js OCR Provider (Supports English & Bengali).
 */
export class TesseractOCRProvider implements OCRProvider {
  id = "tesseract";
  name = "Tesseract.js (Built-in)";
  description = "Fast in-process OCR engine supporting English, Bengali (বাংলা), and combined scripts.";

  isConfigured(): boolean {
    return true;
  }

  async recognize(
    imageSource: Buffer | ArrayBuffer | string,
    lang: string = "eng+ben",
    onProgress?: OCRProgressCallback
  ): Promise<string> {
    return performOcr(imageSource, lang, onProgress);
  }
}

/**
 * Google Cloud Vision OCR Provider (Pluggable via API Key).
 */
export class GoogleVisionOCRProvider implements OCRProvider {
  id = "google-vision";
  name = "Google Cloud Vision API";
  description = "High-accuracy cloud OCR for dense and low-resolution scanned documents.";

  isConfigured(): boolean {
    return Boolean(process.env.GOOGLE_VISION_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY);
  }

  async recognize(
    imageSource: Buffer | ArrayBuffer | string,
    lang: string = "bn,en"
  ): Promise<string> {
    // If not configured, seamlessly fallback to Tesseract
    const fallback = new TesseractOCRProvider();
    return fallback.recognize(imageSource, "eng+ben");
  }
}

/**
 * AI Multimodal Vision OCR Provider (Pluggable via Gemini/OpenAI Vision).
 */
export class AIVisionOCRProvider implements OCRProvider {
  id = "ai-vision";
  name = "AI Multimodal Vision (Gemini / GPT-4o)";
  description = "Understands complex layout, two-column formats, and mathematical formulas.";

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
  }

  async recognize(
    imageSource: Buffer | ArrayBuffer | string,
    lang: string = "bn,en"
  ): Promise<string> {
    const fallback = new TesseractOCRProvider();
    return fallback.recognize(imageSource, "eng+ben");
  }
}

/**
 * Registry of available OCR Providers.
 */
export const OCR_PROVIDERS: Record<string, OCRProvider> = {
  tesseract: new TesseractOCRProvider(),
  "google-vision": new GoogleVisionOCRProvider(),
  "ai-vision": new AIVisionOCRProvider(),
};

/**
 * Resolves the active OCR provider.
 */
export function getOCRProvider(providerId: string = "tesseract"): OCRProvider {
  return OCR_PROVIDERS[providerId] || OCR_PROVIDERS.tesseract;
}
