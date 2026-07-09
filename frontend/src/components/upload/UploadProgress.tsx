import { motion } from "framer-motion";

interface UploadProgressProps {
  progress: number;
}

export const UploadProgress = ({ progress }: UploadProgressProps) => {
  return (
    <div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-paper-dim"
        role="progressbar"
        aria-label="Upload progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <motion.div
          className="h-full rounded-full bg-signal"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      </div>
      <p className="mt-1.5 text-right font-mono text-xs text-ink-soft">{progress}%</p>
    </div>
  );
};
