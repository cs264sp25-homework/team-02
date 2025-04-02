/// <reference lib="webworker" />
import * as Comlink from "comlink";
import * as mupdfjs from "mupdf/mupdfjs";
import { PDFDocument } from "mupdf/mupdfjs";

export const MUPDF_LOADED = "MUPDF_LOADED";

interface MuPdfJsLine {
  text: string;
}

interface MuPdfJsBlock {
  type: string;
  lines: MuPdfJsLine[];
}

export class MupdfWorker {
  private pdfdocument?: PDFDocument;

  constructor() {
    this.initializeMupdf();
  }

  private initializeMupdf() {
    try {
      postMessage(MUPDF_LOADED);
    } catch (error) {
      console.error("Failed to initialize MuPDF:", error);
    }
  }

  loadDocument(document: ArrayBuffer): boolean {
    this.pdfdocument = mupdfjs.PDFDocument.openDocument(
      document,
      "application/pdf",
    ) as PDFDocument;
    return true;
  }

  extractText(): string {
    if (!this.pdfdocument) throw new Error("Document not loaded");

    const fullText = [];
    for (let i = 0; i < this.pdfdocument.countPages(); i++) {
      const page = new mupdfjs.PDFPage(this.pdfdocument, i);
      const json = page.toStructuredText("preserve-whitespace").asJSON();

      try {
        const parsed = JSON.parse(json);
        const pageText = parsed.blocks
          .filter((block: MuPdfJsBlock) => block.type === "text")
          .flatMap((block: MuPdfJsBlock) => block.lines)
          .map((line: MuPdfJsLine) => line.text)
          .join("\n");

        fullText.push(pageText);
      } catch (error) {
        console.error(`Error parsing page ${i}:`, error);
      }
    }

    return fullText.join("\n\n");
  }
}

Comlink.expose(new MupdfWorker());
