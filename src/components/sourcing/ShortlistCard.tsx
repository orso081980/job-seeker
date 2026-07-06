import { useState } from "react";
import type { SourcedCompany } from "../../types";
import { microlinkScreenshotUrl } from "../../api/client";
import Button from "../ui/Button";

export default function ShortlistCard({
  company,
  onPromote,
  onDiscard,
}: {
  company: SourcedCompany;
  onPromote: () => Promise<void>;
  onDiscard: () => Promise<void>;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [busy, setBusy] = useState<"promote" | "discard" | null>(null);

  const promote = async () => {
    setBusy("promote");
    try {
      await onPromote();
    } finally {
      setBusy(null);
    }
  };

  const discard = async () => {
    setBusy("discard");
    try {
      await onDiscard();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
      <a
        href={company.website}
        target="_blank"
        rel="noreferrer"
        className="block aspect-[16/10] w-full overflow-hidden bg-gray-100 dark:bg-white/10"
      >
        {!imgFailed ? (
          <img
            src={microlinkScreenshotUrl(company.website)}
            alt={`${company.company} website screenshot`}
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
          {company.company}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5">
          {company.industry && (
            <span className="rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:border-brand-700/40 dark:bg-brand-900/30 dark:text-brand-200">
              {company.industry}
            </span>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {[company.city, company.country].filter(Boolean).join(", ")}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={discard} disabled={busy !== null}>
            {busy === "discard" ? "Removing…" : "Discard"}
          </Button>
          <Button size="sm" onClick={promote} disabled={busy !== null}>
            {busy === "promote" ? "Adding…" : "Add to companies"}
          </Button>
        </div>
      </div>
    </div>
  );
}
