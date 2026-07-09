import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/common/Button";
import { generatePdfReport, PdfGenerationError } from "@/utils/pdfReport";
import type { LatestResumeReport } from "@/types/report.types";

interface DownloadReportButtonProps {
  report: LatestResumeReport | null;
}

type DownloadStatus = "idle" | "generating" | "success" | "error";

const Spinner = () => (
  <motion.span
    aria-hidden="true"
    className="h-4 w-4 shrink-0 rounded-full border-2 border-paper border-t-transparent"
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
  />
);

/**
 * Download Report Button (Step 11): generates and downloads a PDF
 * version of the current session's `LatestResumeReport` on click. All
 * PDF-building logic lives in `utils/pdfReport.ts` — this component
 * only owns the UI state (idle/generating/success/error) around
 * calling it, so DashboardPage stays untouched aside from rendering
 * this component.
 *
 * Hidden entirely when no report exists yet (mirrors the `hasReport`
 * check DashboardPage already uses for the rest of the summary).
 */
export const DownloadReportButton = ({ report }: DownloadReportButtonProps) => {
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const hasReport = Boolean(report?.file);

  if (!hasReport) {
    return null;
  }

  const handleDownload = async () => {
    setStatus("generating");
    setMessage(null);

    try {
      // generatePdfReport awaits a dynamic import of jsPDF before doing any
      // work, which itself yields to the event loop — so the "Generating…"
      // state is guaranteed to paint first without a manual setTimeout hack.
      await generatePdfReport(report);
      setStatus("success");
      setMessage("Your PDF report has downloaded.");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof PdfGenerationError
          ? error.message
          : "Something went wrong while generating your PDF. Please try again.",
      );
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        onClick={handleDownload}
        disabled={status === "generating"}
        className="flex items-center gap-2"
      >
        {status === "generating" && <Spinner />}
        {status === "generating" ? "Generating PDF..." : "Download PDF Report"}
      </Button>

      {message && (
        <motion.span
          key={message}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-1.5 text-sm ${
            status === "error" ? "text-red-600" : "text-ink-soft"
          }`}
          role={status === "error" ? "alert" : "status"}
        >
          {status === "success" && (
            <span aria-hidden="true" className="text-signal">
              ✓
            </span>
          )}
          {message}
        </motion.span>
      )}
    </div>
  );
};
