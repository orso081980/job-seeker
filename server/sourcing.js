import express from "express";
import { requireAuth } from "./auth.js";
import { readSourced, writeSourced, readCompanies, writeCompanies } from "./store.js";
import { searchPlaces } from "./places.js";
import { slugify, domainOf, buildCompanyRecord, resolveLocationFromAddress } from "./util.js";

const router = express.Router();

router.post("/api/sourcing/search", requireAuth, async (req, res) => {
  const { query, lat, lng, radiusMeters, pageToken } = req.body ?? {};
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "query is required" });
  }
  if (typeof lat !== "number" || typeof lng !== "number" || !radiusMeters) {
    return res.status(400).json({ error: "lat, lng and radiusMeters are required" });
  }

  try {
    const [{ places, nextPageToken }, sourced, companies] = await Promise.all([
      searchPlaces({ query, lat, lng, radiusMeters, pageToken }),
      readSourced(),
      readCompanies(),
    ]);

    const sourcedDomains = new Set(sourced.map((s) => domainOf(s.website)));
    const trackedDomains = new Set(companies.map((c) => domainOf(c.website)));

    const withWebsite = places.filter((p) => p.website);
    const results = withWebsite.map((p) => {
      const domain = domainOf(p.website);
      return {
        ...p,
        searchQuery: query,
        alreadySourced: sourcedDomains.has(domain),
        alreadyTracked: trackedDomains.has(domain),
      };
    });

    res.json({
      results,
      nextPageToken,
      skipped: places.length - withWebsite.length,
    });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/api/sourcing", requireAuth, async (_req, res) => {
  res.json(await readSourced());
});

router.post("/api/sourcing", requireAuth, async (req, res) => {
  const body = req.body ?? {};
  if (!body.company || !body.website) {
    return res.status(400).json({ error: "company and website are required" });
  }

  const sourced = await readSourced();
  const domain = domainOf(body.website);
  const existing = sourced.find((s) => domainOf(s.website) === domain);
  if (existing) return res.status(200).json(existing);

  const baseId = slugify(body.company);
  let id = baseId;
  let n = 1;
  while (sourced.some((s) => s.id === id)) {
    id = `${baseId}-${++n}`;
  }

  const resolved = await resolveLocationFromAddress(body);
  const candidate = {
    id,
    placeId: body.placeId ?? "",
    company: body.company,
    website: body.website,
    city: resolved.city ?? "",
    country: resolved.country ?? "",
    industry: body.industry ?? "",
    address: body.address ?? "",
    phone: body.phone ?? "",
    mapsUrl: body.mapsUrl ?? "",
    searchQuery: body.searchQuery ?? "",
    createdAt: new Date().toISOString(),
  };
  sourced.push(candidate);
  await writeSourced(sourced);
  res.status(201).json(candidate);
});

router.delete("/api/sourcing/:id", requireAuth, async (req, res) => {
  const sourced = await readSourced();
  const next = sourced.filter((s) => s.id !== req.params.id);
  if (next.length === sourced.length) return res.status(404).json({ error: "not found" });
  await writeSourced(next);
  res.status(204).end();
});

router.post("/api/sourcing/:id/promote", requireAuth, async (req, res) => {
  const [sourced, companies] = await Promise.all([readSourced(), readCompanies()]);
  const candidate = sourced.find((s) => s.id === req.params.id);
  if (!candidate) return res.status(404).json({ error: "not found" });

  const resolved = await resolveLocationFromAddress(candidate);
  const company = buildCompanyRecord(companies, {
    company: candidate.company,
    website: candidate.website,
    city: resolved.city,
    country: resolved.country,
    industry: candidate.industry,
    address: candidate.address,
    mapsUrl: candidate.mapsUrl,
    searchQuery: candidate.searchQuery,
    contactPhone: candidate.phone,
  });
  companies.push(company);

  await Promise.all([
    writeCompanies(companies),
    writeSourced(sourced.filter((s) => s.id !== candidate.id)),
  ]);

  res.status(201).json(company);
});

export default router;
