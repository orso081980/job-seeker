import express from "express";
import { readCompanies, writeCompanies } from "./store.js";
import { requireAuth, registerAuthRoutes } from "./auth.js";
import { buildCompanyRecord } from "./util.js";
import { detectStack } from "./stackDetect.js";
import sourcingRouter from "./sourcing.js";

const app = express();
app.use(express.json());

registerAuthRoutes(app);
app.use(sourcingRouter);

app.get("/api/companies", async (_req, res) => {
  const companies = await readCompanies();
  res.json(companies);
});

app.post("/api/companies", requireAuth, async (req, res) => {
  const body = req.body ?? {};
  if (!body.company || !body.website) {
    return res.status(400).json({ error: "company and website are required" });
  }
  const companies = await readCompanies();
  const company = buildCompanyRecord(companies, body);
  companies.push(company);
  await writeCompanies(companies);
  res.status(201).json(company);
});

const EDITABLE_FIELDS = [
  "company",
  "website",
  "city",
  "country",
  "industry",
  "description",
  "address",
  "mapsUrl",
  "searchQuery",
  "languages",
  "status",
  "rating",
  "notes",
  "techStackNotes",
  "projectUrl",
  "githubUrl",
  "contactName",
  "contactEmail",
  "contactPhone",
  "contactLinkedIn",
  "hasJobPosting",
  "jobUrl",
];

app.patch("/api/companies/:id", requireAuth, async (req, res) => {
  const companies = await readCompanies();
  const idx = companies.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "not found" });

  const updates = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in req.body) updates[key] = req.body[key];
  }
  companies[idx] = {
    ...companies[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeCompanies(companies);
  res.json(companies[idx]);
});

app.delete("/api/companies/:id", requireAuth, async (req, res) => {
  const companies = await readCompanies();
  const next = companies.filter((c) => c.id !== req.params.id);
  if (next.length === companies.length) return res.status(404).json({ error: "not found" });
  await writeCompanies(next);
  res.status(204).end();
});

app.get("/api/detect-stack", requireAuth, async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "url is required" });
  }
  try {
    const matches = await detectStack(url);
    res.json({ matches });
  } catch (e) {
    res.status(502).json({ error: `Could not fetch site: ${e.message}` });
  }
});

export default app;
