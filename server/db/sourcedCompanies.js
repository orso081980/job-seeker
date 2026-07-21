import { getPool } from "./pool.js";

const COLUMNS = [
  "id",
  "place_id",
  "company",
  "website",
  "city",
  "country",
  "industry",
  "address",
  "phone",
  "maps_url",
  "search_query",
  "created_at",
];

function toRow(s) {
  return [
    s.id,
    s.placeId ?? "",
    s.company,
    s.website,
    s.city ?? "",
    s.country ?? "",
    s.industry ?? "",
    s.address ?? "",
    s.phone ?? "",
    s.mapsUrl ?? "",
    s.searchQuery ?? "",
    s.createdAt ?? "",
  ];
}

// Same replace-all approach as syncCompanies() -- see that file for why.
export async function syncSourcedCompanies(sourced) {
  const pool = getPool();
  if (!pool) return;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM sourced_companies");
    if (sourced.length > 0) {
      const rows = sourced.map(toRow);
      await conn.query(`INSERT INTO sourced_companies (${COLUMNS.join(", ")}) VALUES ?`, [rows]);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
