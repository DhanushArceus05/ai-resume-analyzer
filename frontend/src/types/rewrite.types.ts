/**
 * Phase 5 (Premium Release): "kept" = a structural line (title, company,
 * dates) the rewrite intentionally leaves alone. "already-strong" = a
 * descriptive line whose wording was judged solid rather than reworded.
 * "improved" = a descriptive line that was meaningfully reworded.
 * Optional so this type still matches older API responses that predate it.
 */
export type RewriteLineStatus = "kept" | "already-strong" | "improved";

export interface RewriteLineItem {
  original: string;
  rewritten: string;
  status?: RewriteLineStatus;
  note?: string;
}

export interface RewriteSummarySection {
  original: string;
  rewritten: string;
  status?: RewriteLineStatus;
  note?: string;
}

export interface ResumeRewriteResult {
  sections: {
    summary: RewriteSummarySection;
    experience: RewriteLineItem[];
    projects: RewriteLineItem[];
  };
}

export type RewriteStatus = "idle" | "loading" | "success" | "error";
