import type { Company } from "../types";
import { microlinkScreenshotUrl } from "../api/client";

export function screenshotSrc(company: Pick<Company, "website" | "screenshotUrl" | "screenshotUpdatedAt">) {
  if (company.screenshotUrl) {
    return `${company.screenshotUrl}?v=${encodeURIComponent(company.screenshotUpdatedAt)}`;
  }
  return microlinkScreenshotUrl(company.website);
}
