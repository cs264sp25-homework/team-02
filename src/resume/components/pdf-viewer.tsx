import { Button } from "@/core/components/button";
import { Download } from "lucide-react";

interface PdfViewerProps {
  pdfUrl: string | null;
  generationStatus: string;
}

export const PdfViewer = ({ pdfUrl, generationStatus }: PdfViewerProps) => {
  const handleDownloadPdf = async () => {
    if (!pdfUrl) {
      alert(
        "PDF is not ready yet. Please wait for the generation to complete.",
      );
      return;
    }

    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "resume.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  if (generationStatus !== "completed" || !pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">PDF Preview</h3>
        <p className="mt-1 text-sm text-gray-500">
          {generationStatus === "completed"
            ? "Your PDF is ready to view"
            : "Please wait for the generation to complete"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end p-4 border-b">
        <Button
          onClick={handleDownloadPdf}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
      <div className="flex-1 w-full h-full overflow-hidden">
        <object
          data={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          type="application/pdf"
          className="w-full h-full"
          style={{ maxWidth: "100%", objectFit: "contain" }}
          title="Resume PDF Preview"
        >
          <p>
            Unable to display PDF file.{" "}
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              Download
            </a>{" "}
            instead.
          </p>
        </object>
      </div>
    </div>
  );
};
