import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const TextField = ({ label, id, ...inputProps }: TextFieldProps) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/60 hover:border-ink-soft focus:border-signal focus:ring-2 focus:ring-signal/15 disabled:cursor-not-allowed disabled:opacity-60"
        {...inputProps}
      />
    </div>
  );
};
