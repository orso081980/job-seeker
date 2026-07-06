export type Status =
  | "new"
  | "researching"
  | "contacted"
  | "replied"
  | "in_progress"
  | "won"
  | "lost";

export const STATUSES: { value: Status; label: string }[] = [
  { value: "new", label: "New" },
  { value: "researching", label: "Researching" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "in_progress", label: "In Progress" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export interface Company {
  id: string;
  company: string;
  website: string;
  city: string;
  country: string;
  industry: string;
  description: string;
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
