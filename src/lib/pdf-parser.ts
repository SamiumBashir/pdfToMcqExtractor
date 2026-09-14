import { normalizeExtractedText } from "./text-normalizer";

export interface PageTextData {
  pageNumber: number;
  text: string;
  charCount: number;
}

export interface PDFExtractionResult {
  success: boolean;
  totalPages: number;
  pages: PageTextData[];
  fullText: string;
  isScanned: boolean;
  error?: string;
}

/**
 * Extracts text from a PDF Buffer/Uint8Array page-by-page.
 * Employs a dual-engine architecture:
 * 1. Primary: Native PDFParse engine for robust, worker-independent extraction
 * 2. Fallback: pdfjs-dist with positioning heuristics
 */
export async function extractTextFromPDF(
  pdfBuffer: ArrayBuffer | Uint8Array
): Promise<PDFExtractionResult> {
  const uint8Data = pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);

  // Engine 1: PDFParse
  try {
    const { PDFParse } = (await import("pdf-parse")) as any;
    const parser = new PDFParse(uint8Data);
    const parsed = await parser.getText();

    if (parsed && parsed.pages && parsed.pages.length > 0) {
      const totalPages = parsed.pages.length;
      const pages: PageTextData[] = [];
      let totalChars = 0;

      for (let i = 0; i < parsed.pages.length; i++) {
        const p = parsed.pages[i];
        const normalized = normalizeExtractedText(p.text || "");
        const charCount = normalized.replace(/\s+/g, "").length;
        totalChars += charCount;

        pages.push({
          pageNumber: p.num || i + 1,
          text: normalized,
          charCount,
        });
      }

      const fullText = pages.map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`).join("\n\n");
      const avgCharsPerPage = totalPages > 0 ? totalChars / totalPages : 0;
      const isScanned = avgCharsPerPage < 25;

      return {
        success: true,
        totalPages,
        pages,
        fullText,
        isScanned,
      };
    }
  } catch (parseErr: unknown) {
    console.warn("Primary PDFParse engine failed or not found, falling back to pdfjs-dist:", parseErr);
  }

  // Engine 2: pdfjs-dist fallback
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    try {
      await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    } catch {
      // Ignore if worker already set
    }

    const loadingTask = pdfjs.getDocument({
      data: uint8Data,
      useSystemFonts: true,
      standardFontDataUrl: undefined,
    } as any);

    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;

    if (totalPages === 0) {
      return {
        success: false,
        totalPages: 0,
        pages: [],
        fullText: "",
        isScanned: false,
        error: "The PDF document contains 0 pages.",
      };
    }

    const pages: PageTextData[] = [];
    let totalChars = 0;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      let lastY: number | null = null;
      const lines: string[] = [];
      let currentLine = "";

      for (const item of textContent.items) {
        if (!("str" in item)) continue;
        const textItem = item as { str: string; transform?: number[] };
        const currentY = textItem.transform ? textItem.transform[5] : null;

        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
          if (currentLine.trim()) {
            lines.push(currentLine.trim());
          }
          currentLine = textItem.str;
        } else {
          currentLine += (currentLine ? " " : "") + textItem.str;
        }
        lastY = currentY;
      }

      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }

      const pageRawText = lines.join("\n");
      const normalizedPageText = normalizeExtractedText(pageRawText);
      const charCount = normalizedPageText.replace(/\s+/g, "").length;
      totalChars += charCount;

      pages.push({
        pageNumber: pageNum,
        text: normalizedPageText,
        charCount,
      });
    }

    const fullText = pages.map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`).join("\n\n");
    const avgCharsPerPage = totalPages > 0 ? totalChars / totalPages : 0;
    const isScanned = avgCharsPerPage < 25;

    return {
      success: true,
      totalPages,
      pages,
      fullText,
      isScanned,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes("Password") || errorMsg.includes("password")) {
      return {
        success: false,
        totalPages: 0,
        pages: [],
        fullText: "",
        isScanned: false,
        error: "Password-protected PDFs are not supported. Please remove the password and re-upload.",
      };
    }
    return {
      success: false,
      totalPages: 0,
      pages: [],
      fullText: "",
      isScanned: false,
      error: `Failed to parse PDF: ${errorMsg}`,
    };
  }
}
