// Creates (or use again for another) an admin login backed by the `admins`
// MySQL table -- this is the only way to sign in now.
// Run with: node server/scripts/create-admin.js <username> <password>

import "dotenv/config";
import bcrypt from "bcryptjs";
import { createAdmin } from "../db/admins.js";
import { getPool } from "../db/pool.js";

async function main() {
  const [username, password] = process.argv.slice(2);
  if (!username || !password) {
    console.error("Usage: node server/scripts/create-admin.js <username> <password>");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in .env.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await createAdmin(username, passwordHash);
  console.log(`Admin "${username}" created.`);
  await getPool().end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
