import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ResumeScanMockup } from "@/components/landing/ResumeScanMockup";
import { useAuth } from "@/hooks/useAuth";

export const Hero = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 pb-20 pt-16 md:grid-cols-2 md:pb-28 md:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="font-mono text-xs uppercase tracking-widest text-signal">
          Resume feedback, structured
        </span>
        <h1 className="mt-4 font-display text-4xl font-medium leading-tight text-ink sm:text-5xl">
          Read your resume the way a recruiter{" "}
          <span className="italic text-signal">and</span> an ATS both would.
        </h1>
        <p className="mt-5 max-w-md text-base text-ink-soft">
          Upload your resume and get it annotated line by line — missing
          keywords, weak phrasing, and unquantified impact, flagged the same
          way a careful editor would mark it up.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            to={isAuthenticated ? "/upload" : "/login"}
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-signal"
          >
            Analyze your resume
          </Link>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
          >
            See how it works →
          </a>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <ResumeScanMockup />
      </motion.div>
    </section>
  );
};
