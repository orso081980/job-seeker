import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readCompanies, writeCompanies } from "./store.js";
import { launchBrowser, captureScreenshot } from "./screenshot.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, "..", "public", "screenshots");

let job = null;

export function getStatus() {
  if (!job) return { running: false, total: 0, done: 0, current: null, results: [], startedAt: null, finishedAt: null };
  const { running, total, done, current, results, startedAt, finishedAt } = job;
  return { running, total, done, current, results, startedAt, finishedAt };
}

async function saveScreenshot(id, buffer) {
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  await fs.writeFile(path.join(SCREENSHOTS_DIR, `${id}.png`), buffer);
}

async function markCaptured(id) {
  const companies = await readCompanies();
  const idx = companies.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  companies[idx] = {
    ...companies[idx],
    screenshotUrl: `/screenshots/${id}.png`,
    screenshotUpdatedAt: new Date().toISOString(),
  };
  await writeCompanies(companies);
  return companies[idx];
}

async function runJob(targets) {
  const browser = await launchBrowser();
  try {
    for (const company of targets) {
      job.current = company.company;
      try {
        const { buffer, fit } = await captureScreenshot(browser, company.website);
        await saveScreenshot(company.id, buffer);
        await markCaptured(company.id);
        job.results.push({ id: company.id, company: company.company, ok: true, bytes: buffer.length, fit });
      } catch (err) {
        job.results.push({ id: company.id, company: company.company, ok: false, error: err.message });
      }
      job.done += 1;
    }
  } finally {
    await browser.close();
    job.running = false;
    job.current = null;
    job.finishedAt = new Date().toISOString();
  }
}

export async function startJob(force = false) {
  if (job?.running) return { alreadyRunning: true, status: getStatus() };

  const companies = await readCompanies();
  const targets = force ? companies : companies.filter((c) => !c.screenshotUrl);

  job = {
    running: true,
    total: targets.length,
    done: 0,
    current: null,
    results: [],
    startedAt: new Date().toISOString(),
    finishedAt: null,
  };

  runJob(targets).catch((err) => {
    job.running = false;
    job.current = null;
    job.finishedAt = new Date().toISOString();
    job.error = err.message;
  });

  return { alreadyRunning: false, status: getStatus() };
}

export async function captureSingle(id) {
  const companies = await readCompanies();
  const company = companies.find((c) => c.id === id);
  if (!company) {
    const err = new Error("not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const browser = await launchBrowser();
  try {
    const { buffer } = await captureScreenshot(browser, company.website);
    await saveScreenshot(id, buffer);
  } finally {
    await browser.close();
  }

  return markCaptured(id);
}
