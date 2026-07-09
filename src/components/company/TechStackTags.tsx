import { parseTagList } from "../../utils/parseTagList";
import { getTechIcon } from "../../utils/techIcons";
import TechIcon from "../ui/TechIcon";

export default function TechStackTags({ value, limit }: { value: string; limit?: number }) {
  const tags = parseTagList(value);
  const shown = limit ? tags.slice(0, limit) : tags;

  if (shown.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((tag) => {
        const icon = getTechIcon(tag);
        return icon ? (
          <span
            key={tag}
            title={tag}
            className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 dark:bg-white/10"
          >
            <TechIcon icon={icon} />
          </span>
        ) : (
          <span
            key={tag}
            className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[10px] text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
          >
            {tag}
          </span>
        );
      })}
    </div>
  );
}
