import type { TextareaHTMLAttributes } from "react";

export default function Textarea({
  className = "",
  mono = false,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean }) {
  return (
    <textarea
      className={`w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 dark:border-white/10 dark:bg-white/5 ${
        mono ? "font-mono" : ""
      } ${className}`}
      {...props}
    />
  );
}
