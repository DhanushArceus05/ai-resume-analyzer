import { motion } from "framer-motion";
import type { LatestResumeReport } from "@/types/report.types";

interface WorkflowProgressProps {
  report: LatestResumeReport | null;
}

interface StepDefinition {
  key: keyof LatestResumeReport;
  label: string;
}

const STEPS: StepDefinition[] = [
  { key: "file", label: "Resume Uploaded" },
  { key: "parsedResume", label: "Parsed" },
  { key: "analysis", label: "AI Analyzed" },
  { key: "ats", label: "ATS Scored" },
  { key: "jdMatch", label: "JD Matched" },
  { key: "rewrite", label: "Rewritten" },
  { key: "interview", label: "Interview Questions Generated" },
];

/**
 * Workflow Progress (Step 10): a simple checklist timeline of the
 * seven pipeline stages, driven entirely by which fields are present
 * on the current session report. No separate "progress" state is
 * tracked — presence of the data IS the progress.
 */
export const WorkflowProgress = ({ report }: WorkflowProgressProps) => {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft">
        Workflow Progress
      </h3>

      <ol className="mt-4 space-y-3">
        {STEPS.map((step, index) => {
          const done = Boolean(report?.[step.key]);

          return (
            <li key={step.key} className="flex items-center gap-3">
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{
                  backgroundColor: done ? "var(--color-signal)" : "var(--color-paper-dim)",
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              >
                {done ? (
                  <svg viewBox="0 0 16 16" className="h-3 w-3 fill-none stroke-paper stroke-2">
                    <path d="M3 8.5L6.5 12L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span className="font-mono text-[11px] text-ink-soft">{index + 1}</span>
                )}
              </motion.span>
              <span className={`text-sm ${done ? "text-ink" : "text-ink-soft"}`}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
