# React-PDF Documentation

React-PDF is a powerful library that allows you to display PDF documents in your React applications. This guide will walk you through the essential concepts and usage patterns.

## Installation

First, install the required dependencies:

```bash
npm install @react-pdf/renderer react-pdf
# or
yarn add @react-pdf/renderer react-pdf
```

## Basic PDF Viewer Component

Here's a basic example of how to create a PDF viewer component:

```jsx
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Important: Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function PDFViewer({ pdfUrl }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <div>
      <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
        <Page pageNumber={pageNumber} />
      </Document>
      <p>
        Page {pageNumber} of {numPages}
      </p>
    </div>
  );
}
```

### Code Explanation:

1. **Imports**:

   - `Document`: The main component that loads the PDF file
   - `Page`: Renders individual pages of the PDF
   - `pdfjs`: The core PDF.js library

2. **Worker Configuration**:

   - The worker is required for PDF parsing
   - It's loaded from a CDN, but you can also host it locally

3. **State Management**:

   - `numPages`: Tracks the total number of pages
   - `pageNumber`: Tracks the current page being displayed

4. **Component Structure**:
   - `Document`: Wrapper component that loads the PDF
   - `Page`: Renders the current page
   - Navigation controls show current page and total pages

## Adding Navigation Controls

Here's how to add page navigation controls:

```jsx
function PDFViewer({ pdfUrl }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  function changePage(offset) {
    setPageNumber((prevPageNumber) => prevPageNumber + offset);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  return (
    <div>
      <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
        <Page pageNumber={pageNumber} />
      </Document>
      <div>
        <button disabled={pageNumber <= 1} onClick={previousPage}>
          Previous
        </button>
        <p>
          Page {pageNumber} of {numPages}
        </p>
        <button disabled={pageNumber >= numPages} onClick={nextPage}>
          Next
        </button>
      </div>
    </div>
  );
}
```

### Navigation Features:

1. **Page Control Functions**:

   - `changePage`: Generic function to change pages by offset
   - `previousPage`: Moves to the previous page
   - `nextPage`: Moves to the next page

2. **Button States**:
   - Previous button is disabled on the first page
   - Next button is disabled on the last page

## Error Handling

Here's how to add error handling to your PDF viewer:

```jsx
function PDFViewer({ pdfUrl }) {
  const [error, setError] = useState(null);

  function onDocumentLoadError(error) {
    setError("An error occurred while loading the PDF.");
    console.error("Error loading PDF:", error);
  }

  return (
    <div>
      {error ? (
        <div className="error">{error}</div>
      ) : (
        <Document file={pdfUrl} onLoadError={onDocumentLoadError}>
          <Page pageNumber={pageNumber} />
        </Document>
      )}
    </div>
  );
}
```

### Error Handling Features:

1. **Error State**:

   - Tracks error state in component
   - Displays user-friendly error message

2. **Error Callback**:
   - `onDocumentLoadError`: Handles PDF loading errors
   - Logs error details to console for debugging

## Custom Styling

Here's how to add custom styling to your PDF viewer:

```jsx
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

function PDFViewer({ pdfUrl }) {
  return (
    <div className="pdf-viewer">
      <Document
        file={pdfUrl}
        className="pdf-document"
      >
        <Page
          pageNumber={pageNumber}
          className="pdf-page"
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </Document>
    </div>
  );
}

// CSS
.pdf-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.pdf-document {
  max-width: 100%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.pdf-page {
  margin: 10px 0;
}
```

### Styling Features:

1. **Required CSS Imports**:

   - Annotation layer styles
   - Text layer styles

2. **Component Classes**:

   - Container class for overall layout
   - Document class for PDF container
   - Page class for individual pages

3. **Rendering Options**:
   - `renderTextLayer`: Enables text selection
   - `renderAnnotationLayer`: Enables PDF annotations

## Advanced Features

### Zoom Controls

```jsx
function PDFViewer({ pdfUrl }) {
  const [scale, setScale] = useState(1.0);

  function zoomIn() {
    setScale((prevScale) => Math.min(prevScale + 0.1, 2.0));
  }

  function zoomOut() {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.5));
  }

  return (
    <div>
      <div className="zoom-controls">
        <button onClick={zoomOut}>-</button>
        <span>{Math.round(scale * 100)}%</span>
        <button onClick={zoomIn}>+</button>
      </div>
      <Document file={pdfUrl}>
        <Page pageNumber={pageNumber} scale={scale} />
      </Document>
    </div>
  );
}
```

### Loading State

```jsx
function PDFViewer({ pdfUrl }) {
  const [loading, setLoading] = useState(true);

  function onDocumentLoadSuccess() {
    setLoading(false);
  }

  return (
    <div>
      {loading && <div>Loading PDF...</div>}
      <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
        <Page pageNumber={pageNumber} />
      </Document>
    </div>
  );
}
```

## Best Practices

1. **Performance Optimization**:

   - Use `loading` prop to show loading states
   - Implement pagination for large documents
   - Use `renderTextLayer={false}` if text selection isn't needed

2. **Error Handling**:

   - Always implement error boundaries
   - Provide fallback UI for failed loads
   - Log errors for debugging

3. **Accessibility**:

   - Add ARIA labels for navigation controls
   - Ensure keyboard navigation works
   - Provide alternative content for screen readers

4. **Responsive Design**:
   - Use relative units for sizing
   - Implement mobile-friendly controls
   - Test on different screen sizes

## Common Issues and Solutions

1. **Worker Loading Issues**:

   ```jsx
   // Solution: Ensure worker is properly loaded
   pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
   ```

2. **Memory Leaks**:

   ```jsx
   // Solution: Clean up resources
   useEffect(() => {
     return () => {
       // Cleanup code
     };
   }, []);
   ```

3. **CORS Issues**:
   - Ensure PDF files are served with proper CORS headers
   - Use a proxy if necessary for cross-origin requests

## Additional Resources

- [React-PDF GitHub Repository](https://github.com/wojtekmaj/react-pdf)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [React-PDF Examples](https://react-pdf.org/examples)

## Project-Specific Implementation

Our project implements a more advanced PDF viewer with additional features. Here's a detailed look at our implementation:

### Component Structure

```tsx
interface PdfViewerProps {
  pdfUrl: string | null;
  generationStatus: string;
  setClickedText: (text: string) => void;
}

const PdfViewer = ({
  pdfUrl,
  generationStatus,
  setClickedText,
}: PdfViewerProps) => {
  // ... component implementation
};
```

### Key Features

1. **PDF Generation Status Handling**:

```tsx
if (generationStatus !== "completed" || !pdfUrl) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      {/* Loading state UI */}
    </div>
  );
}
```

2. **Fallback Mechanism**:

```tsx
const [useFallback, setUseFallback] = useState(false);
const timeoutRef = useRef<NodeJS.Timeout>(null);

useEffect(() => {
  setNumPages(null);
  setUseFallback(false);

  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }

  if (pdfUrl) {
    timeoutRef.current = setTimeout(() => {
      setUseFallback(true);
    }, 3000);
  }

  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
}, [pdfUrl]);
```

3. **Text Selection and Click Handling**:

```tsx
useEffect(() => {
  const handleTextLayerClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const text = target.textContent;
    if (text) {
      setClickedText(text);
    }
  };
  const ref = viewerRef.current;

  if (ref) {
    ref.addEventListener("dblclick", handleTextLayerClick);
  }

  return () => {
    if (ref) {
      ref.removeEventListener("dblclick", handleTextLayerClick);
    }
  };
}, [setClickedText]);
```

4. **PDF Download Functionality**:

```tsx
const handleDownloadPdf = async () => {
  if (!pdfUrl) {
    alert("PDF is not ready yet. Please wait for the generation to complete.");
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
```

5. **Custom PDF Options**:

```tsx
const options = useMemo(
  () => ({
    cMapUrl: "/cmaps/",
    standardFontDataUrl: "/standard_fonts/",
  }),
  [],
);
```

6. **Error Boundary Implementation**:

```tsx
<ErrorBoundary
  fallback={<ReactPDFErrorFallback pdfUrl={pdfUrl} />}
  onError={(error, info) => {
    console.error("Error loading PDF:", error);
    console.log("Error info:", info);
  }}
>
  {/* PDF viewer content */}
</ErrorBoundary>
```

### UI Components

1. **Zoom Controls**:

```tsx
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
```

2. **Loading State**:

```tsx
{
  !numPages && (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-600">Loading PDF...</p>
      </div>
    </div>
  );
}
```

### Best Practices Implemented

1. **Resource Cleanup**:

   - Proper cleanup of event listeners
   - Timeout management
   - URL object revocation after download

2. **Error Handling**:

   - Error boundary implementation
   - Fallback UI for failed loads
   - User-friendly error messages

3. **Performance Optimization**:

   - Memoized options
   - Conditional rendering
   - Efficient state management

4. **User Experience**:
   - Loading states
   - Zoom controls
   - Download functionality
   - Text selection support

This implementation provides a robust PDF viewer with additional features like text selection, download capability, and proper error handling, making it suitable for production use.
