import { motion } from "framer-motion";

const annotations = [
  { label: "ATS keyword match", detail: "“Python”, “stakeholder management”", top: "22%" },
  { label: "Weak verb", detail: "Replace “responsible for” with an action verb", top: "48%" },
  { label: "No metric", detail: "Quantify the impact of this line", top: "74%" },
];

const resumeLines = [
  { width: "60%", size: "lg" },
  { width: "40%", size: "sm" },
  { width: "85%", size: "sm" },
  { width: "70%", size: "sm" },
  { width: "90%", size: "sm" },
  { width: "55%", size: "sm" },
  { width: "80%", size: "sm" },
  { width: "65%", size: "sm" },
];

export const ResumeScanMockup = () => {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_20px_60px_-15px_rgba(20,23,31,0.25)]">
        {/* Scan sweep */}
        <motion.div
          initial={{ top: "0%" }}
          animate={{ top: "100%" }}
          transition={{ duration: 2.2, ease: "easeInOut", delay: 0.4 }}
          className="pointer-events-none absolute left-0 right-0 h-24 bg-gradient-to-b from-signal/0 via-signal/10 to-signal/0"
        />

        <div className="flex flex-col gap-4 p-8">
          <div className="h-3 w-1/3 rounded-full bg-ink" />
          <div className="h-2 w-1/4 rounded-full bg-line" />

          <div className="mt-4 flex flex-col gap-2.5">
            {resumeLines.map((line, index) => (
              <div
                key={index}
                className={`rounded-full bg-paper-dim ${line.size === "lg" ? "h-2.5" : "h-2"}`}
                style={{ width: line.width }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Annotation callouts */}
      {annotations.map((note, index) => (
        <motion.div
          key={note.label}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 1 + index * 0.5 }}
          className="absolute -right-4 w-52 translate-x-full rounded-lg border border-signal/30 bg-signal-soft px-3 py-2 text-left shadow-sm sm:-right-8"
          style={{ top: note.top }}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-signal">
            {note.label}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">{note.detail}</p>
        </motion.div>
      ))}
    </div>
  );
};
