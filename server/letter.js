import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(__dirname, "..", "contact-letter.md");
const NAV_TIMEOUT = 20000;
const MAX_SITE_TEXT = 3000;
const CLAUDE_TIMEOUT = 120000;
const MODEL = process.env.LETTER_MODEL || "haiku";

const SCHEMA = {
  type: "object",
  properties: {
    analysis: { type: "string" },
    subject: { type: "string" },
    letter: { type: "string" },
  },
  required: ["analysis", "subject", "letter"],
};

async function scrapeWebsiteText(url) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "load", timeout: NAV_TIMEOUT });
    const { title, description, bodyText } = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="description"]');
      return {
        title: document.title || "",
        description: meta?.getAttribute("content") || "",
        bodyText: document.body?.innerText || "",
      };
    });
    const cleaned = bodyText.replace(/\s+/g, " ").trim().slice(0, MAX_SITE_TEXT);
    return [title, description, cleaned].filter(Boolean).join("\n");
  } finally {
    await browser.close();
  }
}

function buildPrompt(company, siteText, template) {
  return `You are helping a freelance senior full-stack developer write a personalized B2B outreach letter to a company he found while researching potential clients or collaborations.

Below is an EXAMPLE letter he already sent to a different company. Use it as a reference for tone, structure, and length — but do not copy it verbatim. The letter has no signature or closing block (no "Kind regards", name, or contact details) — it ends right after the closing thank-you sentence, since his email client appends its own signature. Do not add one.

The example includes a paragraph about using AI-assisted development workflows (Claude Code, AI coding agents, AI APIs) alongside clean architecture, MVC, and API-first design principles. Always keep this angle in the letter in some form — either as its own paragraph or woven into the closing paragraph about the technical approach, as the example does — adapted naturally to the flow of the letter. Never drop it entirely.

EXAMPLE LETTER:
"""
${template}
"""

NEW COMPANY DETAILS:
- Company: ${company.company}
- Website: ${company.website}
- City: ${company.city || "unknown"}
- Country: ${company.country || "unknown"}
- Industry: ${company.industry || "unknown"}
- Languages on site: ${company.languages || "unknown"}
- Known tech stack: ${company.techStackNotes || "unknown"}
- Internal notes: ${company.notes || "none"}

WEBSITE CONTENT EXCERPT (scraped live):
"""
${siteText || "(could not be fetched)"}
"""

TASK:
1. In "analysis" (3-5 sentences), explain the best angle for this specific company: what to lead with and which experience to emphasize, based on their industry, location, and tech stack.
2. In "subject", write a short, specific email subject line (under 80 characters) referencing the company or the angle — not a generic "Introduction" or "Collaboration opportunity".
3. In "letter", write the full outreach letter following that angle. Adapt the greeting, company name, location and industry references, and technical angle. Write in English unless the site is clearly not in English and a different language would be more effective — if so, write the letter (and subject) in that language and note the choice in "analysis".

Return only the JSON matching the schema.`;
}

function runClaude(prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "claude",
      [
        "-p",
        prompt,
        "--model",
        MODEL,
        "--output-format",
        "json",
        "--json-schema",
        JSON.stringify(SCHEMA),
        "--allowedTools",
        "",
      ],
      { cwd: os.tmpdir(), timeout: CLAUDE_TIMEOUT }
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));

    child.on("error", (err) => {
      if (err.code === "ENOENT") {
        reject(new Error("Claude Code CLI not found. Install it with: npm install -g @anthropic-ai/claude-code"));
      } else {
        reject(err);
      }
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`claude exited with code ${code}: ${stderr.slice(0, 500)}`));
        return;
      }
      try {
        const payload = JSON.parse(stdout);
        resolve(payload.structured_output);
      } catch {
        reject(new Error(`Could not parse claude output: ${stdout.slice(0, 500)}`));
      }
    });
  });
}

export async function generateLetter(company) {
  const template = await fs.readFile(TEMPLATE_PATH, "utf-8");
  const siteText = await scrapeWebsiteText(company.website).catch(() => "");
  const prompt = buildPrompt(company, siteText, template);
  return runClaude(prompt);
}
