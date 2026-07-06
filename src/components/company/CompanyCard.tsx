import { useState } from "react";
import type { Company } from "../../types";
import { microlinkScreenshotUrl } from "../../api/client";
import { countryFlag } from "../../utils/countryFlag";
import { parseTagList } from "../../utils/parseTagList";
import StatusBadge from "./StatusBadge";
import StarRating from "../ui/StarRating";

export default function CompanyCard({
  company,
  onOpen,
  draggable = false,
  onDragStart,
}: {
  company: Company;
  onOpen: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const stackTags = parseTagList(company.techStackNotes).slice(0, 4);
  const languages = parseTagList(company.languages);

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-150 hover:border-brand-300 hover:shadow-glow dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-700/60"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-gray-100 dark:bg-white/10">
        {!imgFailed ? (
          <img
            src={microlinkScreenshotUrl(company.website)}
            alt={`${company.company} website screenshot`}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover object-top transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            No preview
          </div>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight text-gray-900 dark:text-gray-100">
            {company.company}
          </h3>
          {company.hasJobPosting && (
            <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-200">
              Job open
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {company.industry && (
            <span className="rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:border-brand-700/40 dark:bg-brand-900/30 dark:text-brand-200">
              {company.industry}
            </span>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {[company.city, company.country].filter(Boolean).join(", ")}{" "}
            <span aria-hidden="true">{countryFlag(company.country)}</span>
          </span>
          {languages.map((lang) => (
            <span
              key={lang}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300"
            >
              {lang}
            </span>
          ))}
        </div>

        <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
          {company.description}
        </p>

        {stackTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {stackTags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[10px] text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {company.projectUrl && (
          <a
            href={company.projectUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-block text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
          >
            Live demo ↗
          </a>
        )}

        <div className="flex items-center justify-between pt-1">
          <StatusBadge status={company.status} />
          <StarRating value={company.rating} size="sm" />
        </div>
      </div>
    </div>
  );
}
