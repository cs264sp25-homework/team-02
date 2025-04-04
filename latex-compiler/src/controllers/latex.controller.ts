import { Request, Response } from "express";
import { LatexService } from "../services/latex.service";

export class LatexController {
  private latexService: LatexService;

  constructor() {
    this.latexService = new LatexService();
  }

  compileLatex = async (req: Request, res: Response): Promise<void> => {
    try {
      const latexCode = req.body;

      if (!latexCode || typeof latexCode !== "string") {
        res.status(400).json({
          error: "LaTeX code is required in the request body as plain text",
        });
        return;
      }

      console.log("Compiling LaTeX...");
      const { pdfBuffer, cleanup } =
        await this.latexService.compileLatex(latexCode);

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=document.pdf");

      // Send the PDF
      res.send(pdfBuffer);

      // Clean up temporary files
      await cleanup();
    } catch (error) {
      console.error("Error compiling LaTeX:", error);
      res.status(500).json({
        error: "Failed to compile LaTeX document",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
