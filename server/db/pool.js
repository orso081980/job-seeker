import mysql from "mysql2/promise";

let pool = null;

// Returns null when DATABASE_URL isn't set, so every caller can treat "no
// database configured" as a normal, expected state rather than an error.
export function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      ssl: { minVersion: "TLSv1.2" },
      connectionLimit: 5,
    });
  }
  return pool;
}
