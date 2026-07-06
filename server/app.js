import express from "express";
import { readCompanies, writeCompanies } from "./store.js";
import { requireAuth, registerAuthRoutes } from "./auth.js";

const app = express();
app.use(express.json());

registerAuthRoutes(app);

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

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
  const baseId = slugify(body.company);
  let id = baseId;
  let n = 1;
  while (companies.some((c) => c.id === id)) {
    id = `${baseId}-${++n}`;
  }
  const now = new Date().toISOString();
  const company = {
    id,
    company: body.company,
    website: body.website,
    city: body.city ?? "",
    country: body.country ?? "",
    industry: body.industry ?? "",
    description: body.description ?? "",
    status: "new",
    rating: 0,
    notes: "",
    techStackNotes: "",
    projectUrl: "",
    githubUrl: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactLinkedIn: "",
    hasJobPosting: Boolean(body.hasJobPosting),
    jobUrl: body.jobUrl ?? "",
    createdAt: now,
    updatedAt: now,
  };
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

const STACK_SIGNATURES = [
  { name: "WordPress", test: (html) => /wp-content|wp-includes|wp-json/i.test(html) },
  { name: "WooCommerce", test: (html) => /woocommerce/i.test(html) },
  {
    name: "Shopify",
    test: (html, headers) => /cdn\.shopify\.com|Shopify\.theme/i.test(html) || headers.has("x-shopid"),
  },
  { name: "Wix", test: (html) => /static\.wixstatic\.com|wix\.com/i.test(html) },
  { name: "Squarespace", test: (html) => /squarespace\.com|static1\.squarespace\.com/i.test(html) },
  { name: "Webflow", test: (html) => /webflow\.com|js\.webflow\.com/i.test(html) },
  { name: "Next.js", test: (html) => /__NEXT_DATA__|\/_next\/static/i.test(html) },
  { name: "Nuxt", test: (html) => /__NUXT__|\/_nuxt\//i.test(html) },
  { name: "Gatsby", test: (html) => /window\.___gatsby|\/page-data\//i.test(html) },
  { name: "React", test: (html) => /data-reactroot|react-dom/i.test(html) },
  { name: "Vue.js", test: (html) => /data-v-|__vue__|vue(\.runtime)?\.js/i.test(html) },
  { name: "Angular", test: (html) => /ng-version/i.test(html) },
  { name: "jQuery", test: (html) => /jquery(\.min)?\.js/i.test(html) },
  { name: "Bootstrap", test: (html) => /bootstrap(\.min)?\.(css|js)/i.test(html) },
  { name: "Tailwind CSS", test: (html) => /tailwind(\.min)?\.css|tailwindcss/i.test(html) },
  { name: "Elementor", test: (html) => /elementor/i.test(html) },
  { name: "Drupal", test: (html) => /Drupal\.settings|\/sites\/default\/files/i.test(html) },
  { name: "Magento", test: (html) => /Mage\.Cookies|\/skin\/frontend\//i.test(html) },
  { name: "Joomla", test: (html) => /\/media\/jui\/|Joomla!/i.test(html) },
  { name: "HubSpot", test: (html) => /js\.hs-scripts\.com|hs-analytics/i.test(html) },
  { name: "Google Tag Manager", test: (html) => /googletagmanager\.com\/gtm\.js/i.test(html) },
  { name: "Google Analytics", test: (html) => /google-analytics\.com\/analytics\.js|gtag\(/i.test(html) },
  { name: "Google Fonts", test: (html) => /fonts\.googleapis\.com/i.test(html) },
  { name: "Font Awesome", test: (html) => /font-?awesome/i.test(html) },
  { name: "Stripe", test: (html) => /js\.stripe\.com/i.test(html) },
  { name: "Mailchimp", test: (html) => /list-manage\.com/i.test(html) },
  {
    name: "Cloudflare",
    test: (_html, headers) => /cloudflare/i.test(headers.get("server") ?? "") || headers.has("cf-ray"),
  },
  {
    name: "Vercel",
    test: (_html, headers) => headers.has("x-vercel-id") || /vercel/i.test(headers.get("server") ?? ""),
  },
  { name: "Netlify", test: (_html, headers) => /netlify/i.test(headers.get("server") ?? "") },
  {
    name: "AWS CloudFront",
    test: (_html, headers) => headers.has("x-amz-cf-id") || /cloudfront/i.test(headers.get("via") ?? ""),
  },
  { name: "PHP", test: (_html, headers) => /php/i.test(headers.get("x-powered-by") ?? "") },
  {
    name: "ASP.NET",
    test: (_html, headers) => /asp\.net/i.test(headers.get("x-powered-by") ?? "") || headers.has("x-aspnet-version"),
  },
  { name: "Nginx", test: (_html, headers) => /nginx/i.test(headers.get("server") ?? "") },
  { name: "Apache", test: (_html, headers) => /apache/i.test(headers.get("server") ?? "") },
];

app.get("/api/detect-stack", requireAuth, async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "url is required" });
  }
  let target;
  try {
    target = new URL(url);
    if (!["http:", "https:"].includes(target.protocol)) throw new Error("unsupported protocol");
  } catch {
    return res.status(400).json({ error: "invalid url" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(target, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; StackDetectorBot/1.0)" },
    });
    const html = await response.text();
    const matches = STACK_SIGNATURES.filter((sig) => sig.test(html, response.headers)).map((s) => s.name);
    res.json({ matches });
  } catch (e) {
    res.status(502).json({ error: `Could not fetch site: ${e.message}` });
  } finally {
    clearTimeout(timeout);
  }
});

export default app;
