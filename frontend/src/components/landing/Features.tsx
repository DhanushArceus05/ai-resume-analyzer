import { motion } from "framer-motion";

const features = [
  {
    tag: "[KEYWORDS]",
    title: "Keyword alignment",
    description:
      "Compares your resume against the language of the role you're applying to and flags terms an ATS is likely to search for but won't find.",
  },
  {
    tag: "[IMPACT]",
    title: "Impact, not duties",
    description:
      "Finds lines that describe a responsibility rather than a result, and points out where a number or outcome would make it land.",
  },
  {
    tag: "[FORMATTING]",
    title: "Parseable formatting",
    description:
      "Checks for layout choices — tables, columns, graphics — that read fine to a human but can get silently dropped by parsing software.",
  },
  {
    tag: "[ATS SCORE]",
    title: "A single, explained score",
    description:
      "Rolls every finding into one score, with the reasoning behind it, so you know exactly what to fix first and why it matters.",
  },
];

export const Features = () => {
  return (
    <section id="features" className="border-t border-line bg-paper-dim/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4 }}
          className="max-w-xl"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-signal">
            What gets checked
          </span>
          <h2 className="mt-3 font-display text-3xl font-medium text-ink sm:text-4xl">
            Four categories of feedback, every time.
          </h2>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature.tag}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="border-t border-line pt-5"
            >
              <span className="font-mono text-xs tracking-widest text-signal">
                {feature.tag}
              </span>
              <h3 className="mt-2 font-display text-xl font-medium text-ink">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
