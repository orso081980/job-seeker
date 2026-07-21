import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { syncCompanies } from "./db/companies.js";
import { syncSourcedCompanies } from "./db/sourcedCompanies.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// JSON files stay the source of truth for reads. `mirror` is a best-effort
// copy into MySQL so the data is also queryable there: a failure (or no
// DATABASE_URL configured) is logged and swallowed, never thrown, so the
// database being down or unconfigured can't break a write that already
// succeeded against the JSON file.
function createJsonStore(filename, mirror) {
  const dataPath = path.join(__dirname, "..", "data", filename);

  async function read() {
    if (useBlob) {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: filename, limit: 1 });
      if (blobs.length === 0) return [];
      const res = await fetch(blobs[0].url);
      return res.json();
    }
    try {
      const raw = await fs.readFile(dataPath, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      if (e.code === "ENOENT") return [];
      throw e;
    }
  }

  async function write(items) {
    const body = JSON.stringify(items, null, 2) + "\n";
    if (useBlob) {
      const { put } = await import("@vercel/blob");
      await put(filename, body, {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    } else {
      await fs.writeFile(dataPath, body);
    }

    try {
      await mirror(items);
    } catch (e) {
      console.warn(`[db] failed to mirror ${filename} into MySQL: ${e.message}`);
    }
  }

  return { read, write };
}

const companiesStore = createJsonStore("companies-new.json", syncCompanies);
const sourcedStore = createJsonStore("sourced.json", syncSourcedCompanies);

export const readCompanies = companiesStore.read;
export const writeCompanies = companiesStore.write;
export const readSourced = sourcedStore.read;
export const writeSourced = sourcedStore.write;
