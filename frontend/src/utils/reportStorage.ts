import type { LatestResumeReport, PartialResumeReport } from "@/types/report.types";

const REPORT_KEY_PREFIX = "ai_resume_analyzer_latest_report";

/**
 * Reports are scoped per authenticated user so that switching accounts
 * on the same browser never leaks one user's resume/report data into
 * another's dashboard or upload session. `userId` should be the
 * authenticated user's stable id (User.id from AuthContext).
 */
const buildReportKey = (userId: string): string => `${REPORT_KEY_PREFIX}:${userId}`;

const EMPTY_REPORT: LatestResumeReport = {
  file: null,
  parsedResume: null,
  analysis: null,
  ats: null,
  jdMatch: null,
  rewrite: null,
  interview: null,
  updatedAt: null,
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Reads the latest resume report from localStorage.
 *
 * Defensive by design: a missing key, disabled storage (private
 * browsing / storage blocked), or corrupted non-JSON content never
 * throws — all of these simply mean "no report yet" from the
 * dashboard's point of view. Any recognized object is shallow-merged
 * over the empty shape so a partially-written report (e.g. the user
 * navigated away mid-workflow) can never crash code that expects
 * every key to exist.
 *
 * Requires the current user's id. If no user is authenticated (e.g.
 * the auth session hasn't finished loading yet, or nobody is logged
 * in), there is no safe key to read from, so this always returns null
 * rather than ever falling back to a shared/global key.
 */
export const getLatestReport = (userId: string | null | undefined): LatestResumeReport | null => {
  if (!userId) return null;

  let raw: string | null;

  try {
    raw = localStorage.getItem(buildReportKey(userId));
  } catch {
    return null;
  }

  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed)) return null;

    return { ...EMPTY_REPORT, ...parsed } as LatestResumeReport;
  } catch {
    return null;
  }
};

/**
 * Merges `partial` into whatever report currently exists (or the empty
 * shape, if none does) and persists the result. UploadPage calls this
 * once after each stage of the workflow succeeds, so the dashboard
 * always reflects the latest in-session run.
 *
 * Only ever stores plain-data results already returned by the backend
 * (UploadedResumeMeta, ParsedResume, AIResumeAnalysis, etc.). Never
 * stores the raw uploaded File object, API keys, or any other secret.
 *
 * Requires the current user's id so the write lands in that user's own
 * scoped key. If no user is authenticated, this is a no-op — there is
 * no user to attribute the report to, so nothing is written.
 */
export const saveLatestReport = (
  userId: string | null | undefined,
  partial: PartialResumeReport,
): LatestResumeReport | null => {
  if (!userId) return null;

  const current = getLatestReport(userId) ?? EMPTY_REPORT;

  const next: LatestResumeReport = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(buildReportKey(userId), JSON.stringify(next));
    return next;
  } catch {
    // Storage full, disabled, or unavailable — fail silently. The
    // active UploadPage session still works fine from React state
    // regardless; only the dashboard summary would miss this update.
    return null;
  }
};

/**
 * Clears the stored report for the given user (e.g. before starting a
 * fresh resume run). If no user is authenticated, there is nothing
 * scoped to clear.
 */
export const clearLatestReport = (userId: string | null | undefined): void => {
  if (!userId) return;

  try {
    localStorage.removeItem(buildReportKey(userId));
  } catch {
    // Nothing to clean up if storage isn't available.
  }
};
