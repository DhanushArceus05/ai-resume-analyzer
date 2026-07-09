import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";

interface QuickActionsProps {
  hasReport: boolean;
  hasInterview: boolean;
}

/**
 * Quick Actions (Step 10, updated in the UX bugfix sprint): navigation
 * shortcuts back into the Upload workflow. UploadPage restores the
 * latest saved report on mount, so these links carry a hash
 * (#analysis / #interview) that UploadPage uses to scroll straight to
 * the relevant restored section once it renders.
 */
export const QuickActions = ({ hasReport, hasInterview }: QuickActionsProps) => {
  return (
    <div className="flex flex-wrap gap-3">
      <Link to="/upload">
        <Button type="button">Upload New Resume</Button>
      </Link>

      {hasReport && (
        <Link to="/upload#analysis">
          <Button type="button" variant="secondary">
            Continue Analysis
          </Button>
        </Link>
      )}

      {hasInterview && (
        <Link to="/upload#interview">
          <Button type="button" variant="secondary">
            View Interview Questions
          </Button>
        </Link>
      )}
    </div>
  );
};
