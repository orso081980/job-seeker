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

function fromRow(r) {
  return {
    id: r.id,
    placeId: r.place_id,
    company: r.company,
    website: r.website,
    city: r.city,
    country: r.country,
    industry: r.industry,
    address: r.address,
    phone: r.phone,
    mapsUrl: r.maps_url,
    searchQuery: r.search_query,
    createdAt: r.created_at,
  };
}

// `id` and `created_at` are deliberately absent -- never user-editable (see
// FIELD_BY_COLUMN below, used by the admin Query page's inline cell editor).
const COLUMN_BY_FIELD = {
  placeId: "place_id",
  company: "company",
  website: "website",
  city: "city",
  country: "country",
  industry: "industry",
  address: "address",
  phone: "phone",
  mapsUrl: "maps_url",
  searchQuery: "search_query",
};

export const FIELD_BY_COLUMN = Object.fromEntries(
  Object.entries(COLUMN_BY_FIELD).map(([field, column]) => [column, field])
);

function requirePool() {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not configured");
  return pool;
}

export async function listSourced() {
  const [rows] = await requirePool().query("SELECT * FROM sourced_companies ORDER BY created_at");
  return rows.map(fromRow);
}

export async function findSourcedById(id) {
  const [rows] = await requirePool().query("SELECT * FROM sourced_companies WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function insertSourced(candidate) {
  await requirePool().query(
    `INSERT INTO sourced_companies (${COLUMNS.join(", ")}) VALUES (${COLUMNS.map(() => "?").join(", ")})`,
    toRow(candidate)
  );
  return candidate;
}

// Partial update: only columns present as keys in `patch` are touched.
// Returns the fresh row, or null if no sourced company has this id.
export async function updateSourced(id, patch) {
  const entries = Object.entries(patch).filter(([key]) => key in COLUMN_BY_FIELD);
  if (entries.length === 0) return findSourcedById(id);

  const assignments = entries.map(([key]) => `${COLUMN_BY_FIELD[key]} = ?`);
  const values = entries.map(([, value]) => value);
  values.push(id);

  const [result] = await requirePool().query(
    `UPDATE sourced_companies SET ${assignments.join(", ")} WHERE id = ?`,
    values
  );
  if (result.affectedRows === 0) return null;
  return findSourcedById(id);
}

export async function deleteSourced(id) {
  const [result] = await requirePool().query("DELETE FROM sourced_companies WHERE id = ?", [id]);
  return result.affectedRows > 0;
}
