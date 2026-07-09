import { memo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/common/Button";
import type {
  InterviewQuestion,
  InterviewQuestionSet,
  InterviewStatus,
  QuestionDifficulty,
} from "@/types/interview.types";

interface InterviewSectionProps {
  status: InterviewStatus;
  result: InterviewQuestionSet | null;
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

const DIFFICULTY_CLASSES: Record<QuestionDifficulty, string> = {
  Easy: "bg-signal-soft text-signal",
  Medium: "bg-highlight-soft text-highlight",
  Hard: "bg-red-50 text-red-700",
};

const DifficultyBadge = ({ difficulty }: { difficulty: QuestionDifficulty }) => (
  <span
    className={`inline-block shrink-0 rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest ${DIFFICULTY_CLASSES[difficulty]}`}
  >
    {difficulty}
  </span>
);

interface QuestionAccordionItemProps {
  item: InterviewQuestion;
  isOpen: boolean;
  onToggle: () => void;
  panelId: string;
  triggerId: string;
}

const QuestionAccordionItem = ({ item, isOpen, onToggle, panelId, triggerId }: QuestionAccordionItemProps) => (
  <div className="rounded-2xl border border-line bg-white transition-shadow hover:shadow-sm">
    <button
      type="button"
      id={triggerId}
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={panelId}
      className="flex w-full items-center justify-between gap-4 p-5 text-left"
    >
      <span className="text-sm font-medium leading-relaxed text-ink">{item.question}</span>
      <span className="flex shrink-0 items-center gap-3">
        <DifficultyBadge difficulty={item.difficulty} />
        <motion.span
          aria-hidden="true"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-ink-soft"
        >
          ▾
        </motion.span>
      </span>
    </button>

    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="px-5 pb-5">
            <div className="rounded-xl bg-paper-dim px-4 py-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">
                Why interviewers ask this
              </span>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">{item.whyAsked}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const CategoryGroup = ({
  title,
  items,
  openKeys,
  onToggle,
}: {
  title: string;
  items: InterviewQuestion[];
  openKeys: Set<string>;
  onToggle: (key: string) => void;
}) => (
  <div>
    <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft">
      {title} ({items.length})
    </h3>
    {items.length > 0 ? (
      <div className="mt-3 space-y-3">
        {items.map((item, index) => {
          const key = `${title}-${index}`;
          return (
            <QuestionAccordionItem
              key={key}
              item={item}
              isOpen={openKeys.has(key)}
              onToggle={() => onToggle(key)}
              triggerId={`accordion-trigger-${key}`}
              panelId={`accordion-panel-${key}`}
            />
          );
        })}
      </div>
    ) : (
      <p className="mt-3 text-sm text-ink-soft">No {title.toLowerCase()} questions were generated.</p>
    )}
  </div>
);

export const InterviewSection = memo(function InterviewSection({
  status,
  result,
  errorMessage,
  onGenerate,
  onRetry,
}: InterviewSectionProps) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  const toggleKey = (key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="mt-10" aria-busy={status === "loading"}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-signal">
            Interview preparation
          </span>
          <h2 className="mt-2 font-display text-2xl font-medium text-ink">
            {status === "success" ? "Questions to prepare for" : "Get personalized interview questions"}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ink-soft">
            Technical, project, behavioral, and HR questions generated from your resume and the
            target job description.
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
              ? "Generating..."
              : status === "error"
                ? "Retry"
                : "Generate Interview Questions"}
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {status === "error" && errorMessage && (
          <motion.p
            key="interview-error"
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
            key="interview-loading"
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
              Putting together technical, project, behavioral, and HR questions...
            </p>
          </motion.div>
        )}

        {status === "success" && result && (
          <motion.div
            key="interview-success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 space-y-6"
          >
            <CategoryGroup
              title="Technical"
              items={result.technical}
              openKeys={openKeys}
              onToggle={toggleKey}
            />
            <CategoryGroup title="Project" items={result.project} openKeys={openKeys} onToggle={toggleKey} />
            <CategoryGroup
              title="Behavioral"
              items={result.behavioral}
              openKeys={openKeys}
              onToggle={toggleKey}
            />
            <CategoryGroup title="HR" items={result.hr} openKeys={openKeys} onToggle={toggleKey} />

            <div>
              <Button type="button" variant="secondary" onClick={onGenerate}>
                Re-generate Questions
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
