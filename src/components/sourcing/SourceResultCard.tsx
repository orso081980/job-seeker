import { useState } from "react";
import type { SourceResult } from "../../types";
import { microlinkScreenshotUrl } from "../../api/client";
import Button from "../ui/Button";

export default function SourceResultCard({
  result,
  onAdd,
}: {
  result: SourceResult;
  onAdd: () => Promise<void>;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await onAdd();
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
      <a
        href={result.website}
        target="_blank"
        rel="noreferrer"
        className="block aspect-[16/10] w-full overflow-hidden bg-gray-100 dark:bg-white/10"
      >
        {!imgFailed ? (
          <img
            src={microlinkScreenshotUrl(result.website)}
            alt={`${result.company} website screenshot`}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            No preview
          </div>
        )}
      </a>

      <div className="space-y-2 p-4">
        <h3 className="font-semibold leading-tight text-gray-900 dark:text-gray-100">
          {result.company}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5">
          {result.industry && (
            <span className="rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:border-brand-700/40 dark:bg-brand-900/30 dark:text-brand-200">
              {result.industry}
            </span>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">{result.address}</span>
        </div>

        <a
          href={result.website}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
        >
          Open website ↗
        </a>

        <div className="pt-1">
          {result.alreadyTracked ? (
            <span className="text-xs font-medium text-gray-400">Already tracked</span>
          ) : result.alreadySourced ? (
            <span className="text-xs font-medium text-brand-600 dark:text-brand-300">
              In shortlist ✓
            </span>
          ) : (
            <Button size="sm" onClick={handleAdd} disabled={adding}>
              {adding ? "Adding…" : "Add to shortlist"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
