import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/common/Button";
import type { AtsBreakdown, AtsCategoryBreakdown, AtsResult, AtsStatus } from "@/types/ats.types";

interface AtsScoreSectionProps {
  status: AtsStatus;
  result: AtsResult | null;
  errorMessage: string | null;
  onGenerate: () => void;
  onRetry: () => void;
}

const CATEGORY_LABELS: Record<keyof AtsBreakdown, string> = {
  resumeCompleteness: "Resume Completeness",
  skills: "Skills",
  experience: "Experience",
  education: "Education",
  projects: "Projects",
  aiBonus: "AI Bonus",
};

const CATEGORY_ORDER: (keyof AtsBreakdown)[] = [
  "resumeCompleteness",
  "skills",
  "experience",
  "education",
  "projects",
  "aiBonus",
];

const ScoreGauge = ({ score }: { score: number }) => {
  const size = 152;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const dashOffset = circumference * (1 - progress);

  return (
    <div
      className="relative h-[152px] w-[152px] shrink-0"
      role="progressbar"
      aria-label="Overall ATS score"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={score}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-paper-dim)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-signal)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-medium text-ink">{score}</span>
        <span className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">/ 100</span>
      </div>
    </div>
  );
};

const CategoryCard = ({ title, category }: { title: string; category: AtsCategoryBreakdown }) => {
  const percent = category.maxScore > 0 ? (category.score / category.maxScore) * 100 : 0;

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft">{title}</h3>
        <span className="shrink-0 font-mono text-xs text-ink">
          {category.score} / {category.maxScore}
        </span>
      </div>

      <div
        className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-paper-dim"
        role="progressbar"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={category.maxScore}
        aria-valuenow={category.score}
      >
        <motion.div
          className="h-full rounded-full bg-signal"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <p className="mt-3 text-sm text-ink">{category.reason}</p>

      {category.lostPoints.length > 0 && (
        <ul className="mt-2.5 space-y-1.5">
          {category.lostPoints.map((point, index) => (
            <li key={`${point}-${index}`} className="flex gap-2 text-xs text-ink-soft">
              <span aria-hidden="true" className="mt-1 h-1 w-1 shrink-0 rounded-full bg-highlight" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const AtsScoreSection = memo(function AtsScoreSection({
  status,
  result,
  errorMessage,
  onGenerate,
  onRetry,
}: AtsScoreSectionProps) {
  return (
    <div className="mt-10" aria-busy={status === "loading"}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-signal">ATS score</span>
          <h2 className="mt-2 font-display text-2xl font-medium text-ink">
            {status === "success" ? "How this resume scores" : "See how this resume scores with an ATS"}
          </h2>
        </div>

        {status !== "success" && (
          <Button
            type="button"
            onClick={status === "error" ? onRetry : onGenerate}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Scoring..." : status === "error" ? "Retry" : "Generate ATS Score"}
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {status === "error" && errorMessage && (
          <motion.p
            key="ats-error"
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
            key="ats-loading"
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
            <p className="mt-4 text-sm text-ink-soft">Running the resume through the scoring rules...</p>
          </motion.div>
        )}

        {status === "success" && result && (
          <motion.div
            key="ats-success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <div className="flex flex-col items-center gap-5 rounded-2xl border border-line bg-white p-6 sm:flex-row sm:items-center sm:gap-8">
              <ScoreGauge score={result.overallScore} />
              <div className="text-center sm:text-left">
                <span className="inline-block rounded-full bg-signal-soft px-3 py-1 font-mono text-xs uppercase tracking-widest text-signal">
                  {result.label}
                </span>
                <p className="mt-3 text-sm text-ink-soft">
                  Confidence:{" "}
                  <span className="font-medium text-ink">{result.confidence}%</span>
                </p>
                <p className="mt-1 max-w-sm text-xs text-ink-soft">
                  Confidence reflects how much resume data was available to score, not the quality of
                  the resume itself.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 items-start gap-4 auto-rows-auto content-start sm:grid-cols-2">
              {CATEGORY_ORDER.map((key) => (
                <CategoryCard key={key} title={CATEGORY_LABELS[key]} category={result.breakdown[key]} />
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-line bg-white p-5">
              <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                Top Improvements
              </h3>
              <ul className="mt-3 space-y-2">
                {result.topImprovements.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-2 text-sm text-ink">
                    <span className="font-mono text-xs text-signal">{index + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <Button type="button" variant="secondary" onClick={onGenerate}>
                Re-generate score
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
