// Changes the password for an existing admin in the `admins` MySQL table.
// Run with: node server/scripts/change-admin-password.js <username> <new-password>

import "dotenv/config";
import bcrypt from "bcryptjs";
import { updateAdminPassword } from "../db/admins.js";
import { getPool } from "../db/pool.js";

async function main() {
  const [username, password] = process.argv.slice(2);
  if (!username || !password) {
    console.error("Usage: node server/scripts/change-admin-password.js <username> <new-password>");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in .env.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const updated = await updateAdminPassword(username, passwordHash);
  if (!updated) {
    console.error(`No admin found with username "${username}".`);
    process.exitCode = 1;
  } else {
    console.log(`Password updated for "${username}".`);
  }
  await getPool().end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
