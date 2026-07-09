import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { BaseLayout } from "@/layouts/BaseLayout";
import { useAuth } from "@/hooks/useAuth";
import { getLatestReport } from "@/utils/reportStorage";
import type { LatestResumeReport } from "@/types/report.types";
import { EmptyDashboardState } from "@/components/dashboard/EmptyDashboardState";
import { ResumeHealthSummary } from "@/components/dashboard/ResumeHealthSummary";
import { WorkflowProgress } from "@/components/dashboard/WorkflowProgress";
import { InsightCards } from "@/components/dashboard/InsightCards";
import { LatestResumeInfo } from "@/components/dashboard/LatestResumeInfo";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DownloadReportButton } from "@/components/dashboard/DownloadReportButton";

const DashboardPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Session-level summary (Step 10): the stored report only ever
  // changes from UploadPage, so there's no live subscription to set
  // up -- but it can change *between* visits to this page (e.g. the
  // user finished a stage on /upload, then clicked Dashboard). Re-read
  // on every visit to this route (location.key changes on every
  // navigation, including navigating back to an already-visited path)
  // and again on window focus, in case the report was updated in
  // another tab or the page was left open in the background.
  const [report, setReport] = useState<LatestResumeReport | null>(null);

  // Re-read whenever the route is revisited OR the authenticated user
  // changes (login/logout/switch account). Keying off user?.id ensures
  // a freshly logged-in user never renders a stale report left in
  // state from whoever was logged in before them, and that logging out
  // immediately clears the dashboard (getLatestReport returns null with
  // no user id).
  useEffect(() => {
    setReport(getLatestReport(user?.id));
  }, [location.key, user?.id]);

  useEffect(() => {
    const handleFocus = () => setReport(getLatestReport(user?.id));
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user?.id]);

  // A report only counts as "present" once a resume has actually been
  // uploaded. Every later field may still be null while the user is
  // partway through the workflow -- each section below handles that
  // on its own instead of gating the whole dashboard on completeness.
  const hasReport = Boolean(report?.file);

  return (
    <BaseLayout>
      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <span className="font-mono text-xs uppercase tracking-widest text-signal">Dashboard</span>
        <h1 className="mt-3 font-display text-3xl font-medium text-ink sm:text-4xl">
          Welcome, {user?.name}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Here's a summary of your current resume analysis session.
        </p>

        {!hasReport ? (
          <EmptyDashboardState />
        ) : (
          <div className="mt-10 space-y-6">
            <ResumeHealthSummary ats={report?.ats ?? null} jdMatch={report?.jdMatch ?? null} />

            <div className="grid grid-cols-1 items-start gap-6 auto-rows-auto content-start lg:grid-cols-2">
              <WorkflowProgress report={report} />
              <LatestResumeInfo
                file={report?.file ?? null}
                parsedResume={report?.parsedResume ?? null}
              />
            </div>

            <InsightCards
              analysis={report?.analysis ?? null}
              jdMatch={report?.jdMatch ?? null}
              interview={report?.interview ?? null}
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <QuickActions hasReport={hasReport} hasInterview={Boolean(report?.interview)} />
              <DownloadReportButton report={report} />
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  );
};

export default DashboardPage;
