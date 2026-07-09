import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const CTASection = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-start justify-between gap-8 rounded-2xl bg-ink px-8 py-14 text-paper sm:px-14 md:flex-row md:items-center"
      >
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-highlight">
            Ready when you are
          </span>
          <h2 className="mt-3 max-w-md font-display text-3xl font-medium sm:text-4xl">
            See what your resume is actually saying.
          </h2>
        </div>
        <Link
          to={isAuthenticated ? "/upload" : "/login"}
          className="shrink-0 rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-highlight-soft"
        >
          Analyze your resume
        </Link>
      </motion.div>
    </section>
  );
};
