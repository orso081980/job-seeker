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
  createdAt: string;
  updatedAt: string;
}

export type NewCompanyInput = Pick<
  Company,
  "company" | "website" | "city" | "country" | "industry" | "description"
>;

export interface SourceSearchParams {
  query: string;
  city: string;
  country: string;
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
  city: string;
  country: string;
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
