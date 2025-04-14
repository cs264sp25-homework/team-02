import latex from "node-latex";

export class LatexService {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = "/tmp/latex";
  }

  async compileLatex(
    latexCode: string,
  ): Promise<{ pdfBuffer: Buffer; cleanup: () => Promise<void> }> {
    try {
      // Create a promise to handle the PDF compilation
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const pdfStream = latex(latexCode);
        const chunks: Buffer[] = [];
        pdfStream.on("data", (chunk: Buffer) => chunks.push(chunk));
        pdfStream.on("end", () => resolve(Buffer.concat(chunks)));
        pdfStream.on("error", (error: Error) => reject(error));
      });

      // Return PDF buffer and cleanup function
      return {
        pdfBuffer,
        cleanup: async () => {
          // No cleanup needed for this service
        },
      };
    } catch (error) {
      // Clean up on error
      console.error("Error compiling LaTeX:", error);
      throw error;
    }
  }
}
