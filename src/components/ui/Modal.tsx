import type { MouseEvent, ReactNode } from "react";

export default function Modal({
  onBackdropClick,
  className = "",
  children,
}: {
  onBackdropClick?: () => void;
  className?: string;
  children: ReactNode;
}) {
  const handleBackdropClick = onBackdropClick
    ? (e: MouseEvent) => {
        if (e.target === e.currentTarget) onBackdropClick();
      }
    : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-ink-900 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
