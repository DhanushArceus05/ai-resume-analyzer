import { memo, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/common/Button";
import { TextArea } from "@/components/common/TextArea";
import type { JdMatchResult, JdMatchStatus } from "@/types/jd.types";

interface JdMatchSectionProps {
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  status: JdMatchStatus;
  result: JdMatchResult | null;
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

const SkillPill = ({ label, tone }: { label: string; tone: "matched" | "missing" }) => {
  const toneClasses =
    tone === "matched"
      ? "bg-signal-soft text-signal"
      : "bg-highlight-soft text-highlight";

  return (
    <span className={`inline-block rounded-full px-3 py-1 font-mono text-xs ${toneClasses}`}>{label}</span>
  );
};

const ResultCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-2xl border border-line bg-white p-5">
    <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft">{title}</h3>
    <div className="mt-3">{children}</div>
  </div>
);

export const JdMatchSection = memo(function JdMatchSection({
  jobDescription,
  onJobDescriptionChange,
  status,
  result,
  errorMessage,
  onAnalyze,
  onRetry,
}: JdMatchSectionProps) {
  return (
    <div className="mt-10" aria-busy={status === "loading"}>
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-signal">
          Job description match
        </span>
        <h2 className="mt-2 font-display text-2xl font-medium text-ink">
          See how this resume matches a specific role
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Paste the full job description below to compare it against this resume.
        </p>
      </div>

      <div className="mt-5">
        <TextArea
          id="job-description"
          label="Job description"
          rows={8}
          placeholder="Paste the job description here..."
          value={jobDescription}
          onChange={(event) => onJobDescriptionChange(event.target.value)}
          disabled={status === "loading"}
        />
      </div>

      <div className="mt-4">
        <Button
          type="button"
          onClick={status === "error" ? onRetry : onAnalyze}
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <span className="flex items-center gap-2">
              <Spinner />
              Analyzing...
            </span>
          ) : status === "error" ? (
            "Retry"
          ) : status === "success" ? (
            "Re-analyze JD Match"
          ) : (
            "Analyze JD Match"
          )}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {status === "error" && errorMessage && (
          <motion.p
            key="jd-error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMessage}
          </motion.p>
        )}

        {status === "success" && result && (
          <motion.div
            key="jd-success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 space-y-4"
          >
            <div className="flex flex-col items-center gap-5 rounded-2xl border border-line bg-white p-6 sm:flex-row sm:items-center sm:gap-8">
              <div className="text-center sm:text-left">
                <span className="font-display text-3xl font-medium text-ink">
                  {result.matchScore}
                  <span className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">
                    {" "}
                    / 100
                  </span>
                </span>
                <div className="mt-2">
                  <span className="inline-block rounded-full bg-signal-soft px-3 py-1 font-mono text-xs uppercase tracking-widest text-signal">
                    {result.label}
                  </span>
                </div>
              </div>
            </div>

            <ResultCard title="Matched skills">
              {result.matchedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.matchedSkills.map((skill) => (
                    <SkillPill key={skill} label={skill} tone="matched" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-soft">
                  No skills from the job description were found in this resume.
                </p>
              )}
            </ResultCard>

            <ResultCard title="Missing skills">
              {result.missingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.missingSkills.map((skill) => (
                    <SkillPill key={skill} label={skill} tone="missing" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-soft">
                  No missing skills detected — this resume covers the job description well.
                </p>
              )}
            </ResultCard>

            <ResultCard title="Keyword overlap">
              {result.keywordOverlap.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.keywordOverlap.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-block rounded-full border border-line px-3 py-1 font-mono text-xs text-ink"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-soft">No overlapping keywords were detected.</p>
              )}
            </ResultCard>

            <ResultCard title="Recommendations">
              <ul className="space-y-2">
                {result.recommendations.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-2 text-sm text-ink">
                    <span className="font-mono text-xs text-signal">{index + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </ResultCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
