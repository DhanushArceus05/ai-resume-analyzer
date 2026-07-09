import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { motion } from "framer-motion";
import { EmptyUploadState } from "@/components/upload/EmptyUploadState";

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
}

export const UploadDropzone = ({ onFileSelected }: UploadDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const handleBrowseClick = () => inputRef.current?.click();

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
    // Reset so selecting the same file again still fires onChange.
    event.target.value = "";
  };

  return (
    <motion.div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleBrowseClick}
      role="button"
      tabIndex={0}
      aria-label="Upload resume: drag and drop or click to browse"
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleBrowseClick();
        }
      }}
      animate={{
        borderColor: isDragging ? "var(--color-signal)" : "var(--color-line)",
        backgroundColor: isDragging ? "var(--color-signal-soft)" : "var(--color-paper)",
        scale: isDragging ? 1.01 : 1,
      }}
      transition={{ duration: 0.15 }}
      className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 outline-none"
    >
      <EmptyUploadState />
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleInputChange}
      />
    </motion.div>
  );
};
