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

function requirePool() {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not configured");
  return pool;
}

export async function listSourced() {
  const [rows] = await requirePool().query("SELECT * FROM sourced_companies ORDER BY created_at");
  return rows.map(fromRow);
}

export async function insertSourced(candidate) {
  await requirePool().query(
    `INSERT INTO sourced_companies (${COLUMNS.join(", ")}) VALUES (${COLUMNS.map(() => "?").join(", ")})`,
    toRow(candidate)
  );
  return candidate;
}

export async function deleteSourced(id) {
  const [result] = await requirePool().query("DELETE FROM sourced_companies WHERE id = ?", [id]);
  return result.affectedRows > 0;
}
