import { motion } from "framer-motion";
import type { AtsResult } from "@/types/ats.types";
import type { JdMatchResult } from "@/types/jd.types";

interface ResumeHealthSummaryProps {
  ats: AtsResult | null;
  jdMatch: JdMatchResult | null;
}

interface MiniScoreBarProps {
  label: string;
  score: number | null;
  badge?: string | null;
  caption?: string;
  emptyHint: string;
}

/**
 * Lightweight horizontal score bar. Deliberately simpler than the
 * circular gauge on the Upload page's ATS section — the dashboard is a
 * summary surface, not the detailed breakdown.
 */
const MiniScoreBar = ({ label, score, badge, caption, emptyHint }: MiniScoreBarProps) => {
  const hasScore = typeof score === "number";
  const clamped = hasScore ? Math.max(0, Math.min(100, score)) : 0;

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft">{label}</h3>
        {badge && (
          <span className="rounded-full bg-signal-soft px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-widest text-signal">
            {badge}
          </span>
        )}
      </div>

      {hasScore ? (
        <>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-display text-3xl font-medium text-ink">{clamped}</span>
            <span className="pb-1 font-mono text-xs text-ink-soft">/ 100</span>
          </div>
          <div
            className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-paper-dim"
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={clamped}
          >
            <motion.div
              className="h-full rounded-full bg-signal"
              initial={{ width: 0 }}
              animate={{ width: `${clamped}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          {caption && <p className="mt-2.5 text-xs text-ink-soft">{caption}</p>}
        </>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">{emptyHint}</p>
      )}
    </div>
  );
};

/**
 * Resume Health Summary (Step 10): ATS score/label/confidence and JD
 * match score/label, side by side. Either half can be missing —
 * ATS and JD matching are separate, optional stages in the workflow —
 * so each bar handles its own "not run yet" state independently.
 */
export const ResumeHealthSummary = ({ ats, jdMatch }: ResumeHealthSummaryProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <MiniScoreBar
        label="ATS Score"
        score={ats?.overallScore ?? null}
        badge={ats?.label ?? null}
        caption={ats ? `Confidence: ${ats.confidence}%` : undefined}
        emptyHint="Not generated yet in this session."
      />
      <MiniScoreBar
        label="JD Match Score"
        score={jdMatch?.matchScore ?? null}
        badge={jdMatch?.label ?? null}
        emptyHint="Paste a job description on the Upload page to see this."
      />
    </div>
  );
};
