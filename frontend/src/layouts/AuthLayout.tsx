import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const AuthLayout = ({ eyebrow, title, subtitle, children }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-mono text-xs tracking-widest text-signal">[AI]</span>
          <span className="font-display text-lg font-medium text-ink">Resume Analyzer</span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <span className="font-mono text-xs uppercase tracking-widest text-signal">
            {eyebrow}
          </span>
          <h1 className="mt-3 font-display text-3xl font-medium text-ink">{title}</h1>
          <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>

          <div className="mt-8 rounded-2xl border border-line bg-white/60 p-6 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
