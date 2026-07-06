import type { InputHTMLAttributes, ReactNode } from "react";

export default function Checkbox({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={`flex items-center gap-2 ${className}`}>
      <input type="checkbox" className="accent-brand-600" {...props} />
      {label}
    </label>
  );
}
