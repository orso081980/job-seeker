import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client";
import type { ScreenshotJobStatus } from "../../types";
import Button from "../ui/Button";

const POLL_MS = 1200;

export default function ScreenshotsButton({ onDone }: { onDone: () => void }) {
  const [status, setStatus] = useState<ScreenshotJobStatus | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const wasRunning = useRef(false);

  useEffect(() => {
    api.screenshotsStatus().then(setStatus).catch(() => {});
  }, []);

  useEffect(() => {
    if (!status?.running) return;
    wasRunning.current = true;
    const timer = setInterval(async () => {
      const next = await api.screenshotsStatus().catch(() => null);
      if (!next) return;
      setStatus(next);
      if (!next.running && wasRunning.current) {
        wasRunning.current = false;
        const failed = next.results.filter((r) => !r.ok).length;
        setSummary(
          `Done: ${next.results.length} screenshotted${failed ? `, ${failed} failed` : ""}.`
        );
        onDone();
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [status?.running, onDone]);

  const start = async () => {
    setSummary(null);
    const next = await api.screenshotsStart();
    setStatus(next);
  };

  if (status?.running) {
    return (
      <span className="text-xs text-gray-500 dark:text-gray-400">
        Screenshotting {status.done}/{status.total}
        {status.current ? ` · ${status.current}` : ""}…
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {summary && <span className="text-xs text-gray-500 dark:text-gray-400">{summary}</span>}
      <Button variant="ghost" size="xs" onClick={start}>
        Take screenshots
      </Button>
    </div>
  );
}
