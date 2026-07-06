import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "data", "companies.json");
const BLOB_PATHNAME = "companies.json";

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function readCompanies() {
  if (useBlob) {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 1 });
    if (blobs.length === 0) return [];
    const res = await fetch(blobs[0].url);
    return res.json();
  }
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

export async function writeCompanies(companies) {
  const body = JSON.stringify(companies, null, 2) + "\n";
  if (useBlob) {
    const { put } = await import("@vercel/blob");
    await put(BLOB_PATHNAME, body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return;
  }
  await fs.writeFile(DATA_PATH, body);
}
