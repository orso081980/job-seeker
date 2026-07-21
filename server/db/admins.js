import { getPool } from "./pool.js";

export async function findAdminByUsername(username) {
  const pool = getPool();
  if (!pool) return null;

  const [rows] = await pool.query(
    "SELECT id, username, password_hash FROM admins WHERE username = ? LIMIT 1",
    [username]
  );
  return rows[0] ?? null;
}

export async function createAdmin(username, passwordHash) {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not configured");

  await pool.query(
    "INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)",
    [username, passwordHash, new Date().toISOString()]
  );
}

export async function updateAdminPassword(username, passwordHash) {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not configured");

  const [result] = await pool.query("UPDATE admins SET password_hash = ? WHERE username = ?", [
    passwordHash,
    username,
  ]);
  return result.affectedRows > 0;
}
