import type { ReactNode } from "react";

export default function Label({ children }: { children: ReactNode }) {
  return (
    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {children}
    </label>
  );
}
