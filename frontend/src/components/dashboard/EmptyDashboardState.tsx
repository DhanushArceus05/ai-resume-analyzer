import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";

/**
 * Shown on the Dashboard when no resume has been run through the
 * workflow yet in this session (Step 10). No history/database is
 * involved — this is purely "nothing in localStorage right now".
 */
export const EmptyDashboardState = () => (
  <div className="mt-10 flex flex-col items-center rounded-2xl border border-line bg-white px-6 py-16 text-center">
    <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">
      No resume report yet
    </span>
    <h2 className="mt-3 font-display text-2xl font-medium text-ink">
      Nothing to summarize yet
    </h2>
    <p className="mt-2 max-w-sm text-sm text-ink-soft">
      Upload a resume to see your ATS score, JD match, and interview prep all in one place.
    </p>
    <Link to="/upload" className="mt-6">
      <Button type="button">Upload Resume</Button>
    </Link>
  </div>
);
