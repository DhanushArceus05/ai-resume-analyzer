import type { UploadedResumeMeta, ParsedResume } from "@/types/upload.types";

interface LatestResumeInfoProps {
  file: UploadedResumeMeta | null;
  parsedResume: ParsedResume | null;
}

interface InfoRow {
  label: string;
  value: string;
}

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return "–";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "–";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

/**
 * Latest Resume Info (Step 10): the file-level and parse-level facts
 * about the most recent resume run through the workflow. Reads
 * defensively — `file` and `parsedResume` can each independently be
 * missing depending on how far the session got.
 */
export const LatestResumeInfo = ({ file, parsedResume }: LatestResumeInfoProps) => {
  const rows: InfoRow[] = [
    { label: "File name", value: file?.originalName ?? "–" },
    { label: "Upload date", value: formatDate(file?.uploadedAt) },
    { label: "Word count", value: parsedResume ? String(parsedResume.metadata.wordCount) : "–" },
    {
      label: "Character count",
      value: parsedResume ? String(parsedResume.metadata.characterCount) : "–",
    },
    { label: "Detected email", value: parsedResume?.basicInfo.email ?? "Not detected" },
    { label: "Detected phone", value: parsedResume?.basicInfo.phone ?? "Not detected" },
  ];

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft">
        Latest Resume Info
      </h3>

      <dl className="mt-4 space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 text-sm">
            <dt className="text-ink-soft">{row.label}</dt>
            <dd className="max-w-[60%] truncate text-right font-medium text-ink" title={row.value}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
