import type {
  Company,
  LetterResult,
  NewCompanyInput,
  ScreenshotJobStatus,
  SendLetterResult,
  SentEmail,
  SourceResult,
  SourceSearchParams,
  SourceSearchResponse,
  SourcedCompany,
} from "../types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  list: () => request<Company[]>("/api/companies"),
  create: (input: NewCompanyInput) =>
    request<Company>("/api/companies", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, patch: Partial<Company>) =>
    request<Company>(`/api/companies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  remove: (id: string) =>
    request<void>(`/api/companies/${id}`, { method: "DELETE" }),
  detectStack: (website: string) =>
    request<{ matches: string[] }>(`/api/detect-stack?url=${encodeURIComponent(website)}`),
  login: (username: string, password: string) =>
    request<{ authenticated: boolean }>("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ authenticated: boolean }>("/api/logout", { method: "POST" }),
  session: () => request<{ authenticated: boolean }>("/api/session"),
  sourcingSearch: (params: SourceSearchParams) =>
    request<SourceSearchResponse>("/api/sourcing/search", {
      method: "POST",
      body: JSON.stringify(params),
    }),
  sourcingList: () => request<SourcedCompany[]>("/api/sourcing"),
  sourcingAdd: (result: SourceResult) =>
    request<SourcedCompany>("/api/sourcing", {
      method: "POST",
      body: JSON.stringify(result),
    }),
  sourcingRemove: (id: string) => request<void>(`/api/sourcing/${id}`, { method: "DELETE" }),
  sourcingPromote: (id: string) =>
    request<Company>(`/api/sourcing/${id}/promote`, { method: "POST" }),
  screenshotsStart: (force = false) =>
    request<ScreenshotJobStatus>("/api/screenshots", {
      method: "POST",
      body: JSON.stringify({ force }),
    }),
  screenshotsStatus: () => request<ScreenshotJobStatus>("/api/screenshots/status"),
  screenshotRefresh: (id: string) =>
    request<Company>(`/api/companies/${id}/screenshot`, { method: "POST" }),
  generateLetter: (id: string) =>
    request<LetterResult>(`/api/companies/${id}/letter`, { method: "POST" }),
  sendLetter: (id: string, payload: { subject: string; letter: string; test: boolean }) =>
    request<SendLetterResult>(`/api/companies/${id}/send-letter`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listSentEmails: (id: string) => request<SentEmail[]>(`/api/companies/${id}/emails`),
};

export function microlinkScreenshotUrl(website: string): string {
  const params = new URLSearchParams({
    url: website,
    screenshot: "true",
    meta: "false",
    embed: "screenshot.url",
  });
  return `https://api.microlink.io/?${params.toString()}`;
}

export function builtWithUrl(website: string): string {
  try {
    const host = new URL(website).hostname.replace(/^www\./, "");
    return `https://builtwith.com/${host}`;
  } catch {
    return "https://builtwith.com/";
  }
}
