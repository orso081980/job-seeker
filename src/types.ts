export type Status =
  | "new"
  | "maybe"
  | "contacted"
  | "connected"
  | "proposition"
  | "contracted"
  | "declined";

export const STATUSES: { value: Status; label: string }[] = [
  { value: "new", label: "New" },
  { value: "maybe", label: "Maybe (to call later)" },
  { value: "contacted", label: "Contacted" },
  { value: "connected", label: "Connected" },
  { value: "proposition", label: "Proposition" },
  { value: "contracted", label: "Contracted" },
  { value: "declined", label: "Declined" },
];

export interface Company {
  id: string;
  company: string;
  website: string;
  city: string;
  country: string;
  industry: string;
  description: string;
  address: string;
  mapsUrl: string;
  searchQuery: string;
  languages: string;
  status: Status;
  rating: number;
  notes: string;
  techStackNotes: string;
  projectUrl: string;
  githubUrl: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactLinkedIn: string;
  hasJobPosting: boolean;
  jobUrl: string;
  screenshotUrl: string;
  screenshotUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LetterResult {
  analysis: string;
  subject: string;
  letter: string;
}

export interface SendLetterResult {
  sent: boolean;
  test: boolean;
  to: string;
}

export interface SentEmail {
  id: number;
  companyId: string;
  companyName: string;
  toEmail: string;
  subject: string;
  body: string;
  sentAt: string;
}

export interface ScreenshotResult {
  id: string;
  company: string;
  ok: boolean;
  bytes?: number;
  fit?: boolean;
  error?: string;
}

export interface ScreenshotJobStatus {
  running: boolean;
  total: number;
  done: number;
  current: string | null;
  results: ScreenshotResult[];
  startedAt: string | null;
  finishedAt: string | null;
}

export type NewCompanyInput = Pick<
  Company,
  "company" | "industry" | "address" | "website" | "contactPhone" | "description"
>;

export interface SourceSearchParams {
  query: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  pageToken?: string;
}

export interface SourceResult {
  placeId: string;
  company: string;
  website: string;
  address: string;
  phone: string;
  industry: string;
  mapsUrl: string;
  lat?: number;
  lng?: number;
  searchQuery: string;
  alreadySourced: boolean;
  alreadyTracked: boolean;
}

export interface SourceSearchResponse {
  results: SourceResult[];
  nextPageToken: string | null;
  skipped: number;
}

export interface SourcedCompany {
  id: string;
  placeId: string;
  company: string;
  website: string;
  city: string;
  country: string;
  industry: string;
  address: string;
  phone: string;
  mapsUrl: string;
  searchQuery: string;
  createdAt: string;
}
