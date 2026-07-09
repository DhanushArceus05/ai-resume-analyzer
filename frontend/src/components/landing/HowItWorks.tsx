import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Upload your resume",
    description: "PDF or Word. Paste the job description alongside it if you have one.",
  },
  {
    number: "02",
    title: "It gets read twice",
    description: "Once for structure and keywords, the way software parses it, once for substance, the way a person would.",
  },
  {
    number: "03",
    title: "Review the annotations",
    description: "Every finding is anchored to the exact line it applies to, with a reason and a suggested fix.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.4 }}
        className="max-w-xl"
      >
        <span className="font-mono text-xs uppercase tracking-widest text-signal">
          The process
        </span>
        <h2 className="mt-3 font-display text-3xl font-medium text-ink sm:text-4xl">
          Three steps, in order.
        </h2>
      </motion.div>

      <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <span className="font-display text-4xl text-line">{step.number}</span>
            <h3 className="mt-3 font-display text-xl font-medium text-ink">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
