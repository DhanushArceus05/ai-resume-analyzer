import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"
>;

interface ButtonProps extends NativeButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

export const Button = ({ children, variant = "primary", className = "", disabled, ...rest }: ButtonProps) => {
  const base =
    "rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60";
  const variants: Record<string, string> = {
    primary: "bg-ink text-paper hover:bg-signal",
    secondary: "border border-line text-ink hover:border-ink hover:bg-white",
  };

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.015 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </motion.button>
  );
};
