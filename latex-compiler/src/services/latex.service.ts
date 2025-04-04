import * as fs from "fs/promises";
import * as path from "path";
import latex from "node-latex";

export class LatexService {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = "/tmp/latex";
  }

  async compileLatex(
    latexCode: string,
  ): Promise<{ pdfBuffer: Buffer; cleanup: () => Promise<void> }> {
    const timestamp = Date.now();
    const jobDir = path.join(this.tempDir, `job_${timestamp}`);

    try {
      // Create job directory
      await fs.mkdir(jobDir, { recursive: true });

      // Write LaTeX code to file
      const texFilePath = path.join(jobDir, "document.tex");
      await fs.writeFile(texFilePath, latexCode);

      // Create a promise to handle the PDF compilation
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const pdfStream = latex(texFilePath);

        const chunks: Buffer[] = [];
        pdfStream.on("data", (chunk: Buffer) => chunks.push(chunk));
        pdfStream.on("end", () => resolve(Buffer.concat(chunks)));
        pdfStream.on("error", (error: Error) => reject(error));
      });

      // Return PDF buffer and cleanup function
      return {
        pdfBuffer,
        cleanup: async () => {
          try {
            await fs.rm(jobDir, { recursive: true, force: true });
          } catch (error) {
            console.error("Error cleaning up temporary files:", error);
          }
        },
      };
    } catch (error) {
      // Clean up on error
      try {
        await fs.rm(jobDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error("Error cleaning up temporary files:", cleanupError);
      }
      throw error;
    }
  }
}
