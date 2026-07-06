import type { Status } from "../../types";
import { STATUSES } from "../../types";

const COLORS: Record<Status, string> = {
  new: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
  researching: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-200",
  contacted: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
  replied: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
  in_progress: "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200",
  won: "bg-brand-200 text-brand-800 dark:bg-brand-700 dark:text-brand-100",
  lost: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
};

export default function StatusBadge({ status }: { status: Status }) {
  const label = STATUSES.find((s) => s.value === status)?.label ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[status]}`}
    >
      {label}
    </span>
  );
}
