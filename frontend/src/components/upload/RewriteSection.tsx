import { memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/common/Button";
import type {
  RewriteLineItem,
  RewriteLineStatus,
  ResumeRewriteResult,
  RewriteStatus,
} from "@/types/rewrite.types";

interface RewriteSectionProps {
  status: RewriteStatus;
  result: ResumeRewriteResult | null;
  errorMessage: string | null;
  onGenerate: () => void;
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

interface CompareCardProps {
  label: string;
  original: string;
  rewritten: string;
  status?: RewriteLineStatus;
  note?: string;
  onCopy: (text: string, what: string) => void;
}

/**
 * Small badge explaining *why* a line looks unchanged, so "already
 * strong" reads as a deliberate judgment call rather than the feature
 * silently doing nothing (Phase 5 premium polish). Renders nothing for
 * "kept" (structural lines aren't meant to change, so no explanation is
 * needed) or "improved" (the rewritten text already speaks for itself).
 */
const QualityBadge = ({ status }: { status?: RewriteLineStatus }) => {
  if (status !== "already-strong") return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-signal-soft px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-signal">
      Already strong
    </span>
  );
};

/**
 * A single original/improved comparison unit, reused for the summary
 * and for every experience/project line. Keeping this as one shared
 * component (rather than three near-identical blocks) is what lets
 * summary, experience, and projects all get the same original vs.
 * improved treatment without duplicating markup.
 */
const CompareCard = ({ label, original, rewritten, status, note, onCopy }: CompareCardProps) => (
  <div className="rounded-2xl border border-line bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft">{label}</h3>
      <QualityBadge status={status} />
    </div>

    {status === "already-strong" && note && (
      <p className="mt-2 text-xs text-ink-soft">{note}</p>
    )}

    <div className="mt-3 grid items-start gap-4 sm:grid-cols-2">
      <div>
        <span className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">
          Original
        </span>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{original}</p>
      </div>
      <div>
        <span className="font-mono text-[11px] uppercase tracking-widest text-signal">
          Improved
        </span>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{rewritten}</p>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      <Button type="button" variant="secondary" onClick={() => onCopy(rewritten, "Improved")}>
        Copy Improved
      </Button>
      <Button type="button" variant="secondary" onClick={() => onCopy(original, "Original")}>
        Copy Original
      </Button>
    </div>
  </div>
);

const LineItemGroup = ({
  title,
  emptyMessage,
  items,
  onCopy,
}: {
  title: string;
  emptyMessage: string;
  items: RewriteLineItem[];
  onCopy: (text: string, what: string) => void;
}) => (
  <div>
    <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft">{title}</h3>
    {items.length > 0 ? (
      <div className="mt-3 space-y-4">
        {items.map((item, index) => (
          <CompareCard
            key={`${title}-${index}`}
            label={`Entry ${index + 1}`}
            original={item.original}
            rewritten={item.rewritten}
            status={item.status}
            note={item.note}
            onCopy={onCopy}
          />
        ))}
      </div>
    ) : (
      <p className="mt-3 text-sm text-ink-soft">{emptyMessage}</p>
    )}
  </div>
);

export const RewriteSection = memo(function RewriteSection({
  status,
  result,
  errorMessage,
  onGenerate,
  onRetry,
}: RewriteSectionProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToastMessage("Copied!");
    } catch {
      setToastMessage(`Couldn't copy the ${what.toLowerCase()} text — please copy it manually.`);
    }

    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 2000);
  };

  return (
    <div className="mt-10" aria-busy={status === "loading"}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-signal">
            Resume rewrite assistant
          </span>
          <h2 className="mt-2 font-display text-2xl font-medium text-ink">
            {status === "success" ? "Compare your original and improved wording" : "Get an improved version of your wording"}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            We'll suggest clearer, more confident phrasing for your summary, experience, and
            projects — without adding anything you didn't already write.
          </p>
        </div>

        {status !== "success" && (
          <Button
            type="button"
            onClick={status === "error" ? onRetry : onGenerate}
            disabled={status === "loading"}
            className="flex items-center gap-2"
          >
            {status === "loading" && <Spinner />}
            {status === "loading"
              ? "Rewriting..."
              : status === "error"
                ? "Retry"
                : "Generate Resume Rewrite"}
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {status === "error" && errorMessage && (
          <motion.p
            key="rewrite-error"
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
            key="rewrite-loading"
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
              Rewriting your summary, experience, and projects...
            </p>
          </motion.div>
        )}

        {status === "success" && result && (
          <motion.div
            key="rewrite-success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 space-y-6"
          >
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft">Summary</h3>
              <div className="mt-3">
                <CompareCard
                  label="Summary"
                  original={result.sections.summary.original}
                  rewritten={result.sections.summary.rewritten}
                  status={result.sections.summary.status}
                  note={result.sections.summary.note}
                  onCopy={handleCopy}
                />
              </div>
            </div>

            <LineItemGroup
              title="Experience"
              emptyMessage="No experience entries were found on this resume."
              items={result.sections.experience}
              onCopy={handleCopy}
            />

            <LineItemGroup
              title="Projects"
              emptyMessage="No project entries were found on this resume."
              items={result.sections.projects}
              onCopy={handleCopy}
            />

            <div>
              <Button type="button" variant="secondary" onClick={onGenerate}>
                Re-generate Rewrite
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="copy-toast"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            role="status"
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-paper shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
