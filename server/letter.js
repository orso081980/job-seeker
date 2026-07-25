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
const CLAUDE_TIMEOUT = 240000;
const MODEL = process.env.LETTER_MODEL || "haiku";

const SCHEMA = {
  type: "object",
  properties: {
    paragraph: { type: "string" },
  },
  required: ["paragraph"],
};

function buildSubject(company) {
  return `Proposal for a collaboration with the ${company.company} Team - Marco Maffei @ Tech Paw 🐾 🇧🇪`;
}

async function scrapePageText(url, maxLength) {
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
    const cleaned = bodyText.replace(/\s+/g, " ").trim().slice(0, maxLength);
    return [title, description, cleaned].filter(Boolean).join("\n");
  } finally {
    await browser.close();
  }
}

// contact-letter.md is a fixed template. Every paragraph is used verbatim
// (only "[company]" gets substituted) except one: the paragraph that
// mentions why Marco reached out and whether there's an open position. That
// paragraph is the only AI-generated content in the whole letter.
function splitTemplate(template) {
  const paragraphs = template.split(/\n\n+/);
  const targetIndex = paragraphs.findIndex(
    (p) => p.includes("[position of the company]") && p.includes("[outcome from the website]")
  );
  if (targetIndex === -1) {
    throw new Error(
      "contact-letter.md: couldn't find the target paragraph (expected it to contain " +
        "[position of the company] and [outcome from the website])"
    );
  }
  // The paragraph also carries a trailing meta-instruction in brackets (about
  // an open-job-posting variant) that isn't used anymore -- strip it so the
  // model never sees it and can't bleed fragments of it into the output.
  const targetTemplate = paragraphs[targetIndex].replace(/\s*\[this section.*$/s, "");

  return {
    before: paragraphs.slice(0, targetIndex),
    targetTemplate,
    after: paragraphs.slice(targetIndex + 1),
  };
}

function buildPrompt(company, siteText, targetTemplate) {
  return `You are writing exactly ONE paragraph of a fixed outreach-letter template for Marco, a freelance senior full-stack developer contacting a company he found while researching potential clients or collaborations. Every other paragraph in the letter is already finalized and fixed — you are only producing this one paragraph, and it must stay in English regardless of the company's own site language.

PARAGRAPH TEMPLATE:
"""
${targetTemplate}
"""

RULES:
1. Leave the literal text "[company]" exactly as-is, unchanged, wherever it appears — it gets substituted automatically afterward. Do not write the actual company name yourself.
2. "digital agencies" -> replace with a short, natural phrase for THIS company's own industry (e.g. "travel and hospitality businesses", "law firms"), based on the Industry field below (or the website content if Industry is unknown).
3. [position of the company] -> a short phrase about where they are, e.g. "in Brussels" or "in Belgium and the Netherlands", based on City/Country below.
4. [outcome from the website] -> the specific thing that caught his attention on their site. It MUST name something concrete that is actually present in the WEBSITE CONTENT EXCERPT below: a named service, product, client, case study, campaign, or a distinctive phrase/term the site itself uses. Prefer quoting or closely echoing the site's own wording over paraphrasing it into generic marketing language. Reject and retry internally if what you'd write could equally apply to any company in the same industry (e.g. "how you combine X and Y to deliver impactful results for your clients" is too generic even if X and Y come from the site) — it must be specific enough that it could only have been written about this company. If the excerpt is genuinely empty, fall back to something concrete from the Industry/known tech stack fields instead — still not generic filler.
5. Remarks and strategy (below) mix two different kinds of content:
   - PRIVATE notes to himself about whether/when to approach this company (hesitation, timing, "maybe later", priority) — NEVER reveal these.
   - OBSERVATIONS about the company itself — most often about their website's content or language (e.g. "site is in French", "no English version") — weave these into this paragraph as a genuine first-person aside. Example: "I noticed your website is currently only available in French — that's not an issue for me, as I regularly work across languages." This is not optional when such an observation is present.
   If remarks are empty, or contain only private content with no actual observation, don't add anything for this rule.
6. If the known tech stack below mentions WordPress, mention that Marco has direct WordPress experience and now implements it with a modern, decoupled approach — serverless, REST-API-first — rather than traditional theme development. Fold this in naturally alongside rule 4's website observation; don't bolt it on as a separate disconnected sentence.

COMPANY DATA:
- Company: ${company.company}
- Website: ${company.website}
- City: ${company.city || "unknown"}
- Country: ${company.country || "unknown"}
- Industry: ${company.industry || "unknown"}
- Known tech stack: ${company.techStackNotes || "unknown"}
- Remarks and strategy: ${company.notes || "none"}

WEBSITE CONTENT EXCERPT (scraped live):
"""
${siteText || "(could not be fetched)"}
"""

In "paragraph", return only the finished replacement for the paragraph template above and nothing else — no preamble, no explanation — it gets inserted verbatim into the final letter as-is.

Return only JSON matching the schema.`;
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
  const { before, targetTemplate, after } = splitTemplate(template);

  const siteText = await scrapePageText(company.website, MAX_SITE_TEXT).catch(() => "");

  const prompt = buildPrompt(company, siteText, targetTemplate);
  const { paragraph } = await runClaude(prompt);

  const letter = [...before, paragraph, ...after]
    .join("\n\n")
    .replaceAll("[company]", company.company);

  return { subject: buildSubject(company), letter };
}
