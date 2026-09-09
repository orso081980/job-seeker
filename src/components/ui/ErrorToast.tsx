import { useEffect } from "react";

export default function ErrorToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm shadow-glow animate-toast-in dark:border-red-900/50 dark:bg-ink-900">
      <span className="mt-0.5 text-red-500" aria-hidden="true">
        ⚠
      </span>
      <p className="text-gray-700 dark:text-gray-200">{message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-auto shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        ✕
      </button>
    </div>
  );
}
