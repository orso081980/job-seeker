import type { Company, Status } from "../../types";
import { screenshotSrc } from "../../utils/screenshotSrc";
import StatusBadge from "./StatusBadge";
import Button from "../ui/Button";

export default function DrawerHeader({
  company,
  status,
  authed,
  saving,
  refreshingScreenshot,
  onRefreshScreenshot,
}: {
  company: Pick<Company, "website" | "company" | "screenshotUrl" | "screenshotUpdatedAt">;
  status: Status;
  authed: boolean;
  saving: boolean;
  refreshingScreenshot: boolean;
  onRefreshScreenshot: () => void;
}) {
  return (
    <>
      <div className="aspect-[16/9] w-full shrink-0 bg-gray-100 dark:bg-white/10">
        <img
          src={screenshotSrc(company)}
          alt={`${company.company} screenshot`}
          className="h-full w-full object-cover object-top"
        />
      </div>

      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-white/10">
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          {authed && <span className="text-xs text-gray-400">{saving && "Saving…"}</span>}
        </div>
        {authed && (
          <Button variant="ghost" size="xs" onClick={onRefreshScreenshot} disabled={refreshingScreenshot}>
            {refreshingScreenshot ? "Capturing…" : "Refresh screenshot"}
          </Button>
        )}
      </div>
    </>
  );
}
