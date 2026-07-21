// Creates the MySQL tables used to mirror the JSON data stores, and the
// admins table for DB-backed sign-in. Safe to run repeatedly (CREATE TABLE
// IF NOT EXISTS). Run with: node server/scripts/migrate-db.js

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPool } from "../db/pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const pool = getPool();
  if (!pool) {
    console.error("DATABASE_URL is not set in .env -- nothing to migrate.");
    process.exit(1);
  }

  const sql = await fs.readFile(path.join(__dirname, "..", "db", "schema.sql"), "utf-8");
  const withoutComments = sql.replace(/^\s*--.*$/gm, "");
  const statements = withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await pool.query(statement);
  }

  const [tables] = await pool.query("SHOW TABLES");
  console.log("Tables ready:", tables.map((t) => Object.values(t)[0]).join(", "));
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
