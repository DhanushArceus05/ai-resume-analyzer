import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { ParsedResume } from "@/types/upload.types";

const NOT_DETECTED = "Not detected";

const displayValue = (value: string | null | undefined) =>
  value && value.trim().length > 0 ? value : NOT_DETECTED;

interface ResumeInfoCardProps {
  title: string;
  className?: string;
  children: ReactNode;
}

const ResumeInfoCard = ({ title, className = "", children }: ResumeInfoCardProps) => (
  <div className={`rounded-2xl border border-line bg-white p-5 ${className}`}>
    <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft">{title}</h3>
    <div className="mt-3">{children}</div>
  </div>
);

const ListOrFallback = ({ items }: { items: string[] }) => {
  if (items.length === 0) {
    return <p className="text-sm text-ink-soft">{NOT_DETECTED}</p>;
  }

  return (
    <ul className="space-y-1.5 text-sm text-ink">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
};

interface ParsedResumePreviewProps {
  parsedResume: ParsedResume;
}

export const ParsedResumePreview = ({ parsedResume }: ParsedResumePreviewProps) => {
  const { basicInfo, sections, metadata } = parsedResume;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-8"
    >
      <span className="font-mono text-xs uppercase tracking-widest text-signal">
        Parsed resume preview
      </span>
      <h2 className="mt-2 font-display text-2xl font-medium text-ink">Here's what we found</h2>

      <div className="mt-6">
        <ResumeInfoCard title="Basic Info">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ink-soft">Name</dt>
              <dd className="mt-0.5 text-sm text-ink">{displayValue(basicInfo.name)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Email</dt>
              <dd className="mt-0.5 text-sm text-ink">{displayValue(basicInfo.email)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Phone</dt>
              <dd className="mt-0.5 text-sm text-ink">{displayValue(basicInfo.phone)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Links</dt>
              <dd className="mt-0.5 text-sm text-ink">
                {basicInfo.links.length > 0 ? (
                  <ul className="space-y-0.5">
                    {basicInfo.links.map((link) => (
                      <li key={link} className="truncate">
                        {link}
                      </li>
                    ))}
                  </ul>
                ) : (
                  NOT_DETECTED
                )}
              </dd>
            </div>
          </dl>
        </ResumeInfoCard>
      </div>

      {/*
        Two-column report layout (deliberately NOT a shared row grid and
        NOT CSS multi-column): a normal grid sizes every row to its
        tallest cell, so if Experience is long, Skills/Education end up
        with a large blank gap underneath them in that same row. CSS
        multi-column avoids that but reorders cards via the browser's own
        column-balancing, which doesn't respect source order.

        Instead, the main content (Experience, Projects -- typically the
        longest sections) and the sidebar (Skills, Education,
        Certifications, Resume Metadata -- typically short, scannable
        facts) are two fully independent vertical stacks side by side.
        Neither column's height affects the other's, so there is no
        shared row to leave a gap in, and card order within each column
        is fixed by source order, not by any balancing algorithm.
      */}
      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <ResumeInfoCard title="Experience">
            <ListOrFallback items={sections.experience} />
          </ResumeInfoCard>

          <ResumeInfoCard title="Projects">
            <ListOrFallback items={sections.projects} />
          </ResumeInfoCard>
        </div>

        <div className="space-y-4">
          <ResumeInfoCard title="Skills">
            {sections.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {sections.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-signal-soft px-2.5 py-1 text-xs text-signal"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-soft">{NOT_DETECTED}</p>
            )}
          </ResumeInfoCard>

          <ResumeInfoCard title="Education">
            <ListOrFallback items={sections.education} />
          </ResumeInfoCard>

          <ResumeInfoCard title="Certifications">
            <ListOrFallback items={sections.certifications} />
          </ResumeInfoCard>

          <ResumeInfoCard title="Resume Metadata">
            <dl className="space-y-1.5 font-mono text-xs text-ink-soft">
              <div className="flex justify-between gap-4">
                <dt>Word count</dt>
                <dd>{metadata.wordCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Character count</dt>
                <dd>{metadata.characterCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Parsed at</dt>
                <dd>{new Date(metadata.parsedAt).toLocaleString()}</dd>
              </div>
            </dl>
          </ResumeInfoCard>
        </div>
      </div>
    </motion.div>
  );
};
