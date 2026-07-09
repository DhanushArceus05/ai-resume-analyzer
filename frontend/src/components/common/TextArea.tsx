import type { TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export const TextArea = ({ label, id, ...textareaProps }: TextAreaProps) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id={id}
        className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/60 hover:border-ink-soft focus:border-signal focus:ring-2 focus:ring-signal/15 disabled:cursor-not-allowed disabled:opacity-60"
        {...textareaProps}
      />
    </div>
  );
};
