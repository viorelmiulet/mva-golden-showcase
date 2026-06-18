import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Loader2, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Wire the pdf.js worker via Vite's URL handling.
// react-pdf v10 ships with pdfjs-dist v5/v6 - use the .mjs worker.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface ContractPdfViewerProps {
  /** Source PDF - blob URL, Blob, ArrayBuffer or remote URL. */
  file: string | Blob | ArrayBuffer | null;
  /** Optional download handler shown in the error fallback. */
  onDownload?: () => void;
}

const ContractPdfViewer = ({ file, onDownload }: ContractPdfViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Observe container width so each <Page> can render at the right responsive size.
  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Reset on new file
  useEffect(() => {
    setNumPages(null);
    setError(null);
  }, [file]);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Nu există document de afișat.
      </div>
    );
  }

  // Subtract a little for padding to avoid horizontal scroll on the page itself
  const pageWidth = Math.max(0, containerWidth - 16);

  return (
    <div ref={containerRef} className="w-full h-full overflow-y-auto bg-muted/30">
      {error ? (
        <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Nu s-a putut afișa previzualizarea PDF. Descarcă documentul pentru a-l vizualiza complet.
          </p>
          {onDownload && (
            <Button onClick={onDownload} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Descarcă PDF
            </Button>
          )}
        </div>
      ) : (
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={(err) => {
            console.error("react-pdf load error:", err);
            setError(err?.message || "load error");
          }}
          loading={
            <div className="flex items-center justify-center h-full py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Nu s-a putut afișa previzualizarea PDF.
              </p>
              {onDownload && (
                <Button onClick={onDownload} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Descarcă PDF
                </Button>
              )}
            </div>
          }
          className="flex flex-col items-center gap-3 py-3"
        >
          {numPages && containerWidth > 0 &&
            Array.from({ length: numPages }, (_, i) => (
              <div
                key={`page_${i + 1}`}
                className="shadow-md bg-white rounded overflow-hidden"
              >
                <Page
                  pageNumber={i + 1}
                  width={pageWidth}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  loading={
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  }
                />
              </div>
            ))}
        </Document>
      )}
    </div>
  );
};

export default ContractPdfViewer;
