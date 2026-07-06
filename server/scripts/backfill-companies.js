// One-off maintenance script: fills in ONLY missing fields on existing
// companies in data/companies.json. Never overwrites a field that already
// has a value. Run with: node server/scripts/backfill-companies.js
//
// Fills:
//   - techStackNotes  -> site signature detection (same as the "Auto-detect" button)
//   - address, mapsUrl, contactPhone -> Google Places, matched by website domain
//
// Left alone (no reliable automated source): description, languages,
// contactName, contactEmail, contactLinkedIn.

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { searchPlaces } from "../places.js";
import { detectStack } from "../stackDetect.js";
import { domainOf } from "../util.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "..", "data", "companies.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const companies = JSON.parse(await fs.readFile(DATA_PATH, "utf-8"));
  const changes = [];

  for (const company of companies) {
    const patch = {};

    if (!company.techStackNotes) {
      try {
        const matches = await detectStack(company.website);
        if (matches.length > 0) patch.techStackNotes = matches.join(", ");
      } catch (e) {
        console.warn(`  [stack]  ${company.company}: ${e.message}`);
      }
    }

    const needsPlaceData = !company.address || !company.mapsUrl || !company.contactPhone;
    if (needsPlaceData) {
      try {
        const { places } = await searchPlaces({
          query: company.company,
          city: company.city,
          country: company.country,
        });
        const match = places.find(
          (p) => p.website && domainOf(p.website) === domainOf(company.website)
        );
        if (match) {
          if (!company.address && match.address) patch.address = match.address;
          if (!company.mapsUrl && match.mapsUrl) patch.mapsUrl = match.mapsUrl;
          if (!company.contactPhone && match.phone) patch.contactPhone = match.phone;
        }
      } catch (e) {
        console.warn(`  [places] ${company.company}: ${e.message}`);
      }
      await sleep(200);
    }

    if (Object.keys(patch).length > 0) {
      Object.assign(company, patch, { updatedAt: new Date().toISOString() });
      changes.push({ company: company.company, patch });
    }
  }

  await fs.writeFile(DATA_PATH, JSON.stringify(companies, null, 2) + "\n");

  console.log(`\nUpdated ${changes.length} of ${companies.length} companies:\n`);
  for (const c of changes) {
    console.log(`- ${c.company}: ${Object.keys(c.patch).join(", ")}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
