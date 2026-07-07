import { useEffect, type MouseEvent, type ReactNode } from "react";

export default function Drawer({
  onClose,
  onBackdropClick,
  children,
}: {
  onClose: () => void;
  onBackdropClick?: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = onBackdropClick
    ? (e: MouseEvent) => {
        if (e.target === e.currentTarget) onBackdropClick();
      }
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={handleBackdropClick}>
      <div className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-ink-900">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
