import type { MouseEvent, ReactNode } from "react";

export default function Drawer({
  onBackdropClick,
  children,
}: {
  onBackdropClick?: () => void;
  children: ReactNode;
}) {
  const handleBackdropClick = onBackdropClick
    ? (e: MouseEvent) => {
        if (e.target === e.currentTarget) onBackdropClick();
      }
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={handleBackdropClick}>
      <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-ink-900">
        {children}
      </div>
    </div>
  );
}
