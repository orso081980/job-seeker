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

// Replaces the whole `companies` table with the given list, so it's always
// an exact mirror of data/companies-new.json after a write. Table volume is
// small (dozens to low hundreds of rows), so a full replace is simpler and
// safer to reason about than diffing/upserting.
export async function syncCompanies(companies) {
  const pool = getPool();
  if (!pool) return;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM companies");
    if (companies.length > 0) {
      const rows = companies.map(toRow);
      await conn.query(`INSERT INTO companies (${COLUMNS.join(", ")}) VALUES ?`, [rows]);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
