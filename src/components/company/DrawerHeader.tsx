import { microlinkScreenshotUrl } from "../../api/client";
import type { Status } from "../../types";
import StatusBadge from "./StatusBadge";

export default function DrawerHeader({
  website,
  companyName,
  status,
  authed,
  saving,
}: {
  website: string;
  companyName: string;
  status: Status;
  authed: boolean;
  saving: boolean;
}) {
  return (
    <>
      <div className="aspect-[16/9] w-full shrink-0 bg-gray-100 dark:bg-white/10">
        <img
          src={microlinkScreenshotUrl(website)}
          alt={`${companyName} screenshot`}
          className="h-full w-full object-cover object-top"
        />
      </div>

      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-white/10">
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          {authed && <span className="text-xs text-gray-400">{saving && "Saving…"}</span>}
        </div>
      </div>
    </>
  );
}
