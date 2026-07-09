import { motion } from "framer-motion";

export const EmptyUploadState = () => {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-signal-soft text-signal"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 16V4" />
          <path d="M6 10l6-6 6 6" />
          <path d="M4 20h16" />
        </svg>
      </motion.div>

      <div>
        <p className="font-display text-lg font-medium text-ink">
          Drag and drop your resume
        </p>
        <p className="mt-1 text-sm text-ink-soft">or click to browse from your computer</p>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-widest text-ink-soft">
        <span>Supported: PDF, DOCX</span>
        <span className="text-line">•</span>
        <span>Maximum: 10MB</span>
      </div>
    </div>
  );
};
