import { PageTextData } from "./pdf-parser";
import { normalizeExtractedText } from "./text-normalizer";

export interface ClientExtractionResult {
  success: boolean;
  totalPages: number;
  pages: PageTextData[];
  fullText: string;
  isScanned: boolean;
  error?: string;
}

/**
 * Extracts text from a PDF Buffer/Uint8Array directly inside the browser.
 * This completely bypasses server body size limits (e.g. 413 Request Entity Too Large),
 * allowing documents up to 150MB+ to be parsed with zero upload lag.
 */
export async function extractTextFromPDFClient(
  pdfBuffer: ArrayBuffer | Uint8Array,
  onProgress?: (current: number, total: number) => void
): Promise<ClientExtractionResult> {
  try {
    const pdfjs = await import("pdfjs-dist");

    // Configure worker via CDN for browser runtime
    if (typeof window !== "undefined") {
      const version = pdfjs.version || "6.3.289";
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
    }

    const uint8Data =
      pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);

    const loadingTask = pdfjs.getDocument({
      data: uint8Data,
      useSystemFonts: true,
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
      onProgress?.(pageNum, totalPages);

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

    const fullText = pages
      .map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`)
      .join("\n\n");
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
        error:
          "Password-protected PDFs are not supported. Please remove the password and re-upload.",
      };
    }
    return {
      success: false,
      totalPages: 0,
      pages: [],
      fullText: "",
      isScanned: false,
      error: `Browser PDF parsing error: ${errorMsg}`,
    };
  }
}
