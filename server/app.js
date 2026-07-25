import express from "express";
import { listCompanies, findCompanyById, insertCompany, updateCompany, deleteCompany } from "./db/companies.js";
import { insertSentEmail, listSentEmails } from "./db/sentEmails.js";
import { requireAuth, registerAuthRoutes } from "./auth.js";
import { buildCompanyRecord, resolveLocationFromAddress } from "./util.js";
import { detectStack } from "./stackDetect.js";
import sourcingRouter from "./sourcing.js";
import { startJob, getStatus, captureSingle } from "./screenshotJob.js";
import { generateLetter } from "./letter.js";
import { sendMail, buildEmailBody } from "./mailer.js";

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

export default app;
