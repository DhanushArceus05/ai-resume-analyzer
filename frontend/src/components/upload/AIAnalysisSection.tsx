import { memo, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/common/Button";
import type { AIAnalysisStatus, AIResumeAnalysis } from "@/types/ai.types";

interface AIAnalysisSectionProps {
  status: AIAnalysisStatus;
  analysis: AIResumeAnalysis | null;
  errorMessage: string | null;
  onAnalyze: () => void;
  onRetry: () => void;
}

const Spinner = () => (
  <motion.span
    aria-hidden="true"
    className="h-4 w-4 shrink-0 rounded-full border-2 border-paper border-t-transparent"
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
  />
);

interface AnalysisCardProps {
  title: string;
  className?: string;
  children: ReactNode;
}

const AnalysisCard = ({ title, className = "", children }: AnalysisCardProps) => (
  <div className={`rounded-2xl border border-line bg-white p-5 ${className}`}>
    <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft">{title}</h3>
    <div className="mt-3">{children}</div>
  </div>
);

const BulletList = ({ items, accent }: { items: string[]; accent: string }) => (
  <ul className="space-y-2 text-sm text-ink">
    {items.map((item, index) => (
      <li key={`${item}-${index}`} className="flex gap-2">
        <span aria-hidden="true" className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${accent}`} />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export const AIAnalysisSection = memo(function AIAnalysisSection({
  status,
  analysis,
  errorMessage,
  onAnalyze,
  onRetry,
}: AIAnalysisSectionProps) {
  return (
    <div className="mt-10" aria-busy={status === "loading"}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-signal">
            AI analysis
          </span>
          <h2 className="mt-2 font-display text-2xl font-medium text-ink">
            {status === "success" ? "Here's how it reads" : "Get an expert read on your resume"}
          </h2>
        </div>

        {status !== "success" && (
          <Button
            type="button"
            onClick={status === "error" ? onRetry : onAnalyze}
            disabled={status === "loading"}
            className="flex items-center gap-2"
          >
            {status === "loading" && <Spinner />}
            {status === "loading" ? "Analyzing..." : status === "error" ? "Retry analysis" : "Analyze Resume"}
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {status === "error" && errorMessage && (
          <motion.p
            key="ai-error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMessage}
          </motion.p>
        )}

        {status === "loading" && (
          <motion.div
            key="ai-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 rounded-2xl border border-line bg-white p-8 text-center"
          >
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-signal">
              <motion.span
                aria-hidden="true"
                className="h-4 w-4 rounded-full border-2 border-paper border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              />
            </div>
            <p className="mt-4 text-sm text-ink-soft">
              Reading through your resume and putting the analysis together...
            </p>
          </motion.div>
        )}

        {status === "success" && analysis && (
          <motion.div
            key="ai-success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 grid grid-cols-1 items-start gap-4 auto-rows-auto content-start sm:grid-cols-2"
          >
            <AnalysisCard title="Overall Summary" className="sm:col-span-2">
              <p className="text-sm leading-relaxed text-ink">{analysis.overallSummary}</p>
            </AnalysisCard>

            <AnalysisCard title="Strengths" className="self-start">
              {analysis.strengths.length > 0 ? (
                <BulletList items={analysis.strengths} accent="bg-signal" />
              ) : (
                <p className="text-sm text-ink-soft">Not detected</p>
              )}
            </AnalysisCard>

            <AnalysisCard title="Weaknesses" className="self-start">
              {analysis.weaknesses.length > 0 ? (
                <BulletList items={analysis.weaknesses} accent="bg-highlight" />
              ) : (
                <p className="text-sm text-ink-soft">Not detected</p>
              )}
            </AnalysisCard>

            <AnalysisCard title="Recommendations" className="sm:col-span-2">
              {analysis.recommendations.length > 0 ? (
                <BulletList items={analysis.recommendations} accent="bg-ink" />
              ) : (
                <p className="text-sm text-ink-soft">Not detected</p>
              )}
            </AnalysisCard>

            <div className="sm:col-span-2">
              <Button type="button" variant="secondary" onClick={onAnalyze}>
                Re-analyze
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
