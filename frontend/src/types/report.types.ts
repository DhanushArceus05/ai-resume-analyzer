import type { UploadedResumeMeta, ParsedResume } from "@/types/upload.types";
import type { AIResumeAnalysis } from "@/types/ai.types";
import type { AtsResult } from "@/types/ats.types";
import type { JdMatchResult } from "@/types/jd.types";
import type { ResumeRewriteResult } from "@/types/rewrite.types";
import type { InterviewQuestionSet } from "@/types/interview.types";

/**
 * Session-level summary of a single resume's journey through the
 * workflow (Step 10). This is NOT a persisted history record — it is
 * the latest snapshot only, read by the Dashboard page and written by
 * UploadPage as each stage completes.
 *
 * Every field mirrors an existing result type from Steps 3-9 exactly;
 * no new shapes are introduced. `file` intentionally holds only
 * `UploadedResumeMeta` (filename/size/date), never the raw `File`
 * object, since raw files are not safe or useful to serialize.
 */
export interface LatestResumeReport {
  file: UploadedResumeMeta | null;
  parsedResume: ParsedResume | null;
  analysis: AIResumeAnalysis | null;
  ats: AtsResult | null;
  jdMatch: JdMatchResult | null;
  rewrite: ResumeRewriteResult | null;
  interview: InterviewQuestionSet | null;
  /** ISO timestamp of the last write, set automatically by reportStorage. */
  updatedAt: string | null;
}

/**
 * Shape accepted by `saveLatestReport`. Callers only ever provide the
 * field(s) that just became available (e.g. `{ ats }` right after ATS
 * scoring finishes) — reportStorage merges it over whatever report
 * already exists. `updatedAt` is not settable by callers; it is always
 * stamped by reportStorage itself.
 */
export type PartialResumeReport = Partial<Omit<LatestResumeReport, "updatedAt">>;
