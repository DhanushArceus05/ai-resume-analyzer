export const ALLOWED_RESUME_EXTENSIONS = [".pdf", ".docx"];

export const ALLOWED_RESUME_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validates a file before it's sent to the server. This is a UX
 * convenience only — the backend re-validates type and size
 * authoritatively regardless of what the client checks.
 */
export const validateResumeFile = (file: File): string | null => {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

  const hasAllowedExtension = ALLOWED_RESUME_EXTENSIONS.includes(extension);
  const hasAllowedMimeType = ALLOWED_RESUME_MIME_TYPES.includes(file.type);

  if (!hasAllowedExtension || !hasAllowedMimeType) {
    return "Only PDF and DOCX files are supported.";
  }

  if (file.size > MAX_RESUME_SIZE_BYTES) {
    return "File exceeds the 10 MB size limit.";
  }

  return null;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getFileExtensionTag = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) return "FILE";
  return fileName.slice(lastDot + 1).toUpperCase();
};
