"use client";

import { X, Download, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl?: string;
  title?: string;
}

export function PDFViewerModal({
  isOpen,
  onClose,
  pdfUrl,
  title = "Pré-visualização da Averbação",
}: PDFViewerModalProps) {
  const [zoom, setZoom] = useState(100);

  if (!isOpen) return null;

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = "averbacao.pdf";
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 flex h-[90vh] w-[90vw] max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="text-zinc-600 transition hover:text-zinc-900 disabled:opacity-40"
                title="Reduzir zoom"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="min-w-[60px] text-center text-sm font-medium text-zinc-700">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="text-zinc-600 transition hover:text-zinc-900 disabled:opacity-40"
                title="Aumentar zoom"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              title="Baixar PDF"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-zinc-100 p-6">
          <div
            className="mx-auto bg-white shadow-lg"
            style={{ width: `${zoom}%`, minHeight: "100%" }}
          >
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="h-full w-full"
                style={{ minHeight: "800px" }}
                title="PDF Preview"
              />
            ) : (
              <div className="flex h-full min-h-[800px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-zinc-200 flex items-center justify-center">
                    <svg
                      className="h-8 w-8 text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-zinc-900">
                    Gerando pré-visualização...
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    O PDF será gerado após a criação da averbação
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
