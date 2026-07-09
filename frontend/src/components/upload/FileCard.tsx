import { AnimatePresence, motion } from "framer-motion";
import { UploadProgress } from "@/components/upload/UploadProgress";
import { Button } from "@/components/common/Button";
import { formatFileSize, getFileExtensionTag } from "@/utils/resumeValidation";
import type { UploadedResumeMeta, UploadStatus } from "@/types/upload.types";

interface FileCardProps {
  file: File;
  status: UploadStatus;
  progress: number;
  errorMessage?: string | null;
  uploadedMeta?: UploadedResumeMeta | null;
  selectedAt: Date;
  onRemove: () => void;
  onUploadAnother: () => void;
  onRetry: () => void;
}

export const FileCard = ({
  file,
  status,
  progress,
  errorMessage,
  uploadedMeta,
  selectedAt,
  onRemove,
  onUploadAnother,
  onRetry,
}: FileCardProps) => {
  const extensionTag = getFileExtensionTag(file.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-line bg-white p-6 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg bg-signal-soft font-mono text-[11px] font-medium tracking-wide text-signal"
        >
          [{extensionTag}]
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{file.name}</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {extensionTag} · {formatFileSize(file.size)} · Selected at{" "}
            {selectedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {status === "success" && (
          <span aria-hidden="true" className="shrink-0 text-lg text-signal">
            ✓
          </span>
        )}
      </div>

      <div className="mt-5">
        <AnimatePresence mode="wait">
          {status === "uploading" && (
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <UploadProgress progress={progress} />
            </motion.div>
          )}

          {status === "success" && uploadedMeta && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-lg bg-signal-soft px-4 py-3"
            >
              <p className="text-sm font-medium text-signal">
                ✅ Resume uploaded successfully
              </p>
              <dl className="mt-2 space-y-1 font-mono text-[11px] text-ink-soft">
                <div className="flex justify-between gap-4">
                  <dt>Original filename</dt>
                  <dd className="truncate">{uploadedMeta.originalName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Stored as</dt>
                  <dd className="truncate">{uploadedMeta.filename}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Size</dt>
                  <dd>{formatFileSize(uploadedMeta.size)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Uploaded at</dt>
                  <dd>{new Date(uploadedMeta.uploadedAt).toLocaleString()}</dd>
                </div>
              </dl>
            </motion.div>
          )}

          {status === "error" && errorMessage && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="alert"
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {status === "success" ? (
          <Button type="button" variant="secondary" onClick={onUploadAnother}>
            Upload another
          </Button>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={onRemove}>
              Remove
            </Button>
            {status === "error" && (
              <Button type="button" onClick={onRetry}>
                Retry
              </Button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
