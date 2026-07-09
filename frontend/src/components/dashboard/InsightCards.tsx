import type { AIResumeAnalysis } from "@/types/ai.types";
import type { JdMatchResult } from "@/types/jd.types";
import type { InterviewQuestionSet } from "@/types/interview.types";

interface InsightCardsProps {
  analysis: AIResumeAnalysis | null;
  jdMatch: JdMatchResult | null;
  interview: InterviewQuestionSet | null;
}

interface InsightCardData {
  key: string;
  label: string;
  count: number | null;
}

const countInterviewQuestions = (interview: InterviewQuestionSet | null): number | null => {
  if (!interview) return null;
  return (
    interview.technical.length +
    interview.project.length +
    interview.behavioral.length +
    interview.hr.length
  );
};

/**
 * Insight Cards (Step 10): quick counts pulled straight from Steps 5,
 * 7, and 9's outputs. Any source that hasn't run yet in this session
 * shows a dash rather than a misleading "0".
 */
export const InsightCards = ({ analysis, jdMatch, interview }: InsightCardsProps) => {
  const cards: InsightCardData[] = [
    { key: "strengths", label: "Top Strengths", count: analysis?.strengths.length ?? null },
    { key: "weaknesses", label: "Weaknesses", count: analysis?.weaknesses.length ?? null },
    {
      key: "recommendations",
      label: "Recommendations",
      count: analysis?.recommendations.length ?? null,
    },
    {
      key: "missingSkills",
      label: "Missing Skills",
      count: jdMatch?.missingSkills.length ?? null,
    },
    {
      key: "interviewQuestions",
      label: "Interview Questions",
      count: countInterviewQuestions(interview),
    },
  ];

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft">Insights</h3>

      <div className="mt-4 grid grid-cols-2 items-start gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.key}
            className="rounded-xl border border-line bg-paper px-4 py-4 text-center"
          >
            <span className="font-display text-2xl font-medium text-ink">
              {card.count ?? "–"}
            </span>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink-soft">
              {card.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
