import { getPool } from "./pool.js";

const COLUMNS = [
  "id",
  "company",
  "website",
  "city",
  "country",
  "industry",
  "description",
  "address",
  "maps_url",
  "search_query",
  "languages",
  "status",
  "rating",
  "notes",
  "tech_stack_notes",
  "project_url",
  "github_url",
  "contact_name",
  "contact_email",
  "contact_phone",
  "contact_linked_in",
  "has_job_posting",
  "job_url",
  "screenshot_url",
  "screenshot_updated_at",
  "created_at",
  "updated_at",
];

// Maps a Company (camelCase, as used everywhere in JS) to the matching
// MySQL column name, so PATCH-style partial updates can be built generically.
const COLUMN_BY_FIELD = {
  company: "company",
  website: "website",
  city: "city",
  country: "country",
  industry: "industry",
  description: "description",
  address: "address",
  mapsUrl: "maps_url",
  searchQuery: "search_query",
  languages: "languages",
  status: "status",
  rating: "rating",
  notes: "notes",
  techStackNotes: "tech_stack_notes",
  projectUrl: "project_url",
  githubUrl: "github_url",
  contactName: "contact_name",
  contactEmail: "contact_email",
  contactPhone: "contact_phone",
  contactLinkedIn: "contact_linked_in",
  hasJobPosting: "has_job_posting",
  jobUrl: "job_url",
  screenshotUrl: "screenshot_url",
  screenshotUpdatedAt: "screenshot_updated_at",
};

function toRow(c) {
  return [
    c.id,
    c.company,
    c.website,
    c.city ?? "",
    c.country ?? "",
    c.industry ?? "",
    c.description ?? "",
    c.address ?? "",
    c.mapsUrl ?? "",
    c.searchQuery ?? "",
    c.languages ?? "",
    c.status ?? "new",
    c.rating ?? 0,
    c.notes ?? "",
    c.techStackNotes ?? "",
    c.projectUrl ?? "",
    c.githubUrl ?? "",
    c.contactName ?? "",
    c.contactEmail ?? "",
    c.contactPhone ?? "",
    c.contactLinkedIn ?? "",
    c.hasJobPosting ? 1 : 0,
    c.jobUrl ?? "",
    c.screenshotUrl ?? "",
    c.screenshotUpdatedAt ?? "",
    c.createdAt ?? "",
    c.updatedAt ?? "",
  ];
}

function fromRow(r) {
  return {
    id: r.id,
    company: r.company,
    website: r.website,
    city: r.city,
    country: r.country,
    industry: r.industry,
    description: r.description ?? "",
    address: r.address,
    mapsUrl: r.maps_url,
    searchQuery: r.search_query,
    languages: r.languages,
    status: r.status,
    rating: r.rating,
    notes: r.notes ?? "",
    techStackNotes: r.tech_stack_notes ?? "",
    projectUrl: r.project_url,
    githubUrl: r.github_url,
    contactName: r.contact_name,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    contactLinkedIn: r.contact_linked_in,
    hasJobPosting: Boolean(r.has_job_posting),
    jobUrl: r.job_url,
    screenshotUrl: r.screenshot_url,
    screenshotUpdatedAt: r.screenshot_updated_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function requirePool() {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not configured");
  return pool;
}

export async function listCompanies() {
  const [rows] = await requirePool().query("SELECT * FROM companies ORDER BY created_at");
  return rows.map(fromRow);
}

export async function findCompanyById(id) {
  const [rows] = await requirePool().query("SELECT * FROM companies WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function insertCompany(company) {
  await requirePool().query(
    `INSERT INTO companies (${COLUMNS.join(", ")}) VALUES (${COLUMNS.map(() => "?").join(", ")})`,
    toRow(company)
  );
  return company;
}

// Partial update: only columns present as keys in `patch` are touched.
// Returns the fresh row, or null if no company has this id.
export async function updateCompany(id, patch) {
  const entries = Object.entries(patch).filter(([key]) => key in COLUMN_BY_FIELD);
  if (entries.length === 0) return findCompanyById(id);

  const assignments = entries.map(([key]) => `${COLUMN_BY_FIELD[key]} = ?`);
  const values = entries.map(([key, value]) => (key === "hasJobPosting" ? (value ? 1 : 0) : value));
  assignments.push("updated_at = ?");
  values.push(new Date().toISOString(), id);

  const [result] = await requirePool().query(`UPDATE companies SET ${assignments.join(", ")} WHERE id = ?`, values);
  if (result.affectedRows === 0) return null;
  return findCompanyById(id);
}

export async function deleteCompany(id) {
  const [result] = await requirePool().query("DELETE FROM companies WHERE id = ?", [id]);
  return result.affectedRows > 0;
}
