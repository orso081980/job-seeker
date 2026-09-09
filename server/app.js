import express from "express";
import {
  listCompanies,
  findCompanyById,
  insertCompany,
  updateCompany,
  deleteCompany,
  FIELD_BY_COLUMN as COMPANY_FIELD_BY_COLUMN,
} from "./db/companies.js";
import { updateSourced, FIELD_BY_COLUMN as SOURCED_FIELD_BY_COLUMN } from "./db/sourcedCompanies.js";
import { insertSentEmail, listSentEmails } from "./db/sentEmails.js";
import { requireAuth, registerAuthRoutes } from "./auth.js";
import { buildCompanyRecord, resolveLocationFromAddress } from "./util.js";
import { detectStack } from "./stackDetect.js";
import sourcingRouter from "./sourcing.js";
import { startJob, getStatus, captureSingle } from "./screenshotJob.js";
import { generateLetter } from "./letter.js";
import { sendMail, buildEmailBody } from "./mailer.js";
import { runReadOnlyQuery, listSchema, fetchRawRow } from "./db/query.js";

const app = express();
app.use(express.json());

registerAuthRoutes(app);
app.use(sourcingRouter);

app.get("/api/companies", async (_req, res) => {
  res.json(await listCompanies());
});

app.post("/api/companies", requireAuth, async (req, res) => {
  const body = req.body ?? {};
  if (!body.company || !body.website) {
    return res.status(400).json({ error: "company and website are required" });
  }
  const companies = await listCompanies();
  const resolved = await resolveLocationFromAddress(body);
  const company = buildCompanyRecord(companies, resolved);
  await insertCompany(company);
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
  const updates = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in req.body) updates[key] = req.body[key];
  }
  const updated = await updateCompany(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: "not found" });
  res.json(updated);
});

app.delete("/api/companies/:id", requireAuth, async (req, res) => {
  const deleted = await deleteCompany(req.params.id);
  if (!deleted) return res.status(404).json({ error: "not found" });
  res.status(204).end();
});

app.post("/api/screenshots", requireAuth, async (req, res) => {
  const force = Boolean(req.body?.force);
  const result = await startJob(force);
  res.status(result.alreadyRunning ? 200 : 202).json(result.status);
});

app.get("/api/screenshots/status", requireAuth, (_req, res) => {
  res.json(getStatus());
});

app.post("/api/companies/:id/screenshot", requireAuth, async (req, res) => {
  try {
    const company = await captureSingle(req.params.id);
    res.json(company);
  } catch (e) {
    res.status(e.code === "NOT_FOUND" ? 404 : 502).json({ error: e.message });
  }
});

app.post("/api/companies/:id/letter", requireAuth, async (req, res) => {
  const company = await findCompanyById(req.params.id);
  if (!company) return res.status(404).json({ error: "not found" });
  try {
    const result = await generateLetter(company);
    res.json(result);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.post("/api/companies/:id/send-letter", requireAuth, async (req, res) => {
  const { subject, letter, test } = req.body ?? {};
  if (!subject || !letter) {
    return res.status(400).json({ error: "subject and letter are required" });
  }

  const company = await findCompanyById(req.params.id);
  if (!company) return res.status(404).json({ error: "not found" });

  const to = test ? process.env.CONTACT_EMAIL : company.contactEmail;
  if (!to) {
    return res.status(400).json({
      error: test ? "CONTACT_EMAIL is not configured" : "This company has no contact email on file",
    });
  }

  try {
    const { text, html } = buildEmailBody(letter);
    await sendMail({
      to,
      toName: test ? process.env.CONTACT_NAME : company.contactName,
      subject,
      text,
      html,
    });
    if (!test) {
      await insertSentEmail({
        companyId: company.id,
        companyName: company.company,
        toEmail: to,
        subject,
        body: text,
      });
    }
    res.json({ sent: true, test: Boolean(test), to });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.get("/api/companies/:id/emails", requireAuth, async (req, res) => {
  res.json(await listSentEmails(req.params.id));
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

app.get("/api/admin/schema", requireAuth, async (_req, res) => {
  try {
    res.json(await listSchema());
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.post("/api/admin/query", requireAuth, async (req, res) => {
  const { sql, page, pageSize } = req.body ?? {};
  if (typeof sql !== "string" || !sql.trim()) {
    return res.status(400).json({ error: "sql is required" });
  }
  try {
    res.json(await runReadOnlyQuery(sql, { page, pageSize }));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Backs the Query page's inline cell editor. Each editable table's update
// function (updateCompany / updateSourced) is the same one the rest of the
// app already trusts -- it only ever touches columns in its own hand-written
// FIELD_BY_COLUMN map, so `id`, `created_at`, and `updated_at` can never be
// written here no matter what the client sends.
const EDITABLE_QUERY_TABLES = {
  companies: { update: updateCompany, fieldByColumn: COMPANY_FIELD_BY_COLUMN },
  sourced_companies: { update: updateSourced, fieldByColumn: SOURCED_FIELD_BY_COLUMN },
};

app.get("/api/admin/query/editable-columns", requireAuth, (_req, res) => {
  const out = {};
  for (const [table, config] of Object.entries(EDITABLE_QUERY_TABLES)) {
    out[table] = Object.keys(config.fieldByColumn);
  }
  res.json(out);
});

app.patch("/api/admin/query/row", requireAuth, async (req, res) => {
  const { table, id, patch } = req.body ?? {};
  const config = typeof table === "string" ? EDITABLE_QUERY_TABLES[table] : undefined;
  if (!config) {
    return res.status(400).json({ error: "This table isn't editable from the query page" });
  }
  if (typeof id !== "string" && typeof id !== "number") {
    return res.status(400).json({ error: "id is required" });
  }
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return res.status(400).json({ error: "patch is required" });
  }

  const fieldPatch = {};
  for (const [column, value] of Object.entries(patch)) {
    const field = config.fieldByColumn[column];
    if (!field) {
      return res.status(400).json({ error: `"${column}" isn't an editable column on ${table}` });
    }
    fieldPatch[field] = value;
  }
  if (Object.keys(fieldPatch).length === 0) {
    return res.status(400).json({ error: "No editable columns in patch" });
  }

  try {
    const updated = await config.update(String(id), fieldPatch);
    if (!updated) return res.status(404).json({ error: "Row not found" });
    const row = await fetchRawRow(table, String(id));
    res.json({ row });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default app;
