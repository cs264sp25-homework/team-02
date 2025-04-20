import { Button } from "@/core/components/button";
import { Download } from "lucide-react";
import { pdfjs } from "react-pdf";
import { Document, Page } from "react-pdf";
import { ErrorBoundary } from "react-error-boundary";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { useState, useEffect, useRef } from "react";

interface PdfViewerProps {
  pdfUrl: string | null;
  generationStatus: string;
  setClickedText: (text: string) => void;
}

const options = {
  cMapUrl: "/cmaps/",
  standardFontDataUrl: "/standard_fonts/",
};

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const PdfViewer = ({
  pdfUrl,
  generationStatus,
  setClickedText,
}: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [docReady, setDocReady] = useState(false);

  useEffect(() => {
    const handleTextLayerClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const text = target.textContent;
      if (text) {
        setClickedText(text);
      }
    };
    const ref = viewerRef.current;

    // Add event listener to the document
    if (ref) {
      ref.addEventListener("dblclick", handleTextLayerClick);
    }

    // Cleanup
    return () => {
      if (ref) {
        ref.removeEventListener("dblclick", handleTextLayerClick);
      }
    };
  }, [setClickedText]);

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

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setTimeout(() => {
      setDocReady(true);
    }, 200);
  };

  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 2.0));
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.5));
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
      <div className="flex justify-between items-center p-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <Button
            onClick={zoomOut}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            -
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button
            onClick={zoomIn}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            +
          </Button>
        </div>
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
      <ErrorBoundary
        fallback={<ReactPDFErrorFallback pdfUrl={pdfUrl} />}
        onError={(error, info) => {
          console.error("Error loading PDF:", error);
          console.log("Error info:", info);
        }}
      >
        <div
          className="flex-1 w-full h-full overflow-auto bg-gray-200 p-6 relative"
          ref={viewerRef}
        >
          {!docReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}
          <Document
            file={pdfUrl}
            onLoad={() => {
              setNumPages(0);
              setDocReady(false);
            }}
            onLoadSuccess={onDocumentLoadSuccess}
            className="flex flex-col items-center"
            options={options}
          >
            {docReady &&
              Array.from(new Array(numPages), (_, index) => (
                <div
                  key={`page_${index + 1}`}
                  className="mb-8 shadow-lg overflow-hidden bg-white"
                >
                  <Page
                    pageNumber={index + 1}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="border border-gray-200"
                  />
                </div>
              ))}
          </Document>
        </div>
      </ErrorBoundary>
    </div>
  );
};

// if react-pdf fails to load, fallback to object tag
function ReactPDFErrorFallback({ pdfUrl }: { pdfUrl: string }) {
  return (
    <div className="flex-1 w-full h-full overflow-hidden">
      <object
        data={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
        type="application/pdf"
        className="w-full h-full"
        style={{ maxWidth: "100%", objectFit: "contain" }}
        title="Resume PDF Preview"
      />
    </div>
  );
}
