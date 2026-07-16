import { chromium } from "playwright";
import sharp from "sharp";

const MAX_BYTES = 500 * 1024;
// Default logical resolution of a 13" MacBook (Pro/Air) display.
const VIEWPORT = { width: 1280, height: 800 };
const NAV_TIMEOUT = 30000;
const WAIT_AFTER_LOAD = 1500;

// Known "accept" buttons for the most common cookie-consent frameworks.
const COOKIE_BUTTON_SELECTORS = [
  "#onetrust-accept-btn-handler",
  "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll",
  "#CybotCookiebotDialogBodyButtonAccept",
  ".iubenda-cs-accept-btn",
  '.qc-cmp2-summary-buttons button[mode="primary"]',
  "#didomi-notice-agree-button",
  ".fc-cta-consent",
  '#usercentrics-root button[data-testid="uc-accept-all-button"]',
  ".osano-cm-accept-all",
  'button[aria-label*="accept" i]',
  'button[aria-label*="agree" i]',
];

// Fallback: any visible button whose text matches a common "accept" phrase
// (English, French, Dutch, Italian — covers the Belgian/Italian sites in the portfolio).
const COOKIE_TEXT_PATTERN =
  /^(accept(\s+(all|cookies))?|i\s+accept|agree|i\s+agree|allow(\s+all|\s+cookies)?|got it|ok|tout accepter|j'accepte|accepter|accepteren|alles accepteren|akkoord|accetta(\s+tutto)?|acconsento)$/i;

// Last-resort CSS hide, in case a banner is still on screen after the click
// attempt (unknown framework, animation delay, etc.). Scoped to vendor
// containers and cookie-specific class/id combos to avoid hiding unrelated content.
const HIDE_COOKIE_CSS = `
  #onetrust-consent-sdk, #CybotCookiebotDialog, .qc-cmp2-container,
  #didomi-host, #usercentrics-root, .iubenda-cs-container,
  .osano-cm-window, #truste-consent-track, .termly-styles-embed-cookie,
  [class*="cookie-banner" i], [class*="cookie-consent" i], [class*="cookie-notice" i],
  [id*="cookie-banner" i], [id*="cookie-consent" i], [id*="cookie-notice" i],
  [class*="gdpr-banner" i], [id*="gdpr-banner" i] {
    display: none !important;
    visibility: hidden !important;
  }
`;

async function dismissCookieBanner(page) {
  for (const selector of COOKIE_BUTTON_SELECTORS) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 500 })) {
        await el.click({ timeout: 1000 });
        await page.waitForTimeout(400);
        return;
      }
    } catch {
      // selector not present or not clickable — try the next one
    }
  }

  try {
    const buttons = page.getByRole("button");
    const count = Math.min(await buttons.count(), 40);
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const text = (await btn.innerText().catch(() => "")).trim();
      if (COOKIE_TEXT_PATTERN.test(text) && (await btn.isVisible().catch(() => false))) {
        await btn.click({ timeout: 1000 }).catch(() => {});
        await page.waitForTimeout(400);
        return;
      }
    }
  } catch {
    // no matching button found — the CSS fallback below will catch the rest
  }
}

// Each entry is tried in order (largest/best quality first) until the
// resulting PNG fits under MAX_BYTES.
const ATTEMPTS = [
  { width: 1280, colors: 256 },
  { width: 1280, colors: 128 },
  { width: 1000, colors: 128 },
  { width: 1000, colors: 64 },
  { width: 800, colors: 64 },
  { width: 640, colors: 48 },
  { width: 480, colors: 32 },
];

async function compressUnderLimit(buffer) {
  let last = null;
  for (const { width, colors } of ATTEMPTS) {
    const out = await sharp(buffer)
      .resize({ width, withoutEnlargement: true })
      .png({ palette: true, colors, compressionLevel: 9 })
      .toBuffer();
    last = out;
    if (out.length <= MAX_BYTES) return { buffer: out, fit: true };
  }
  return { buffer: last, fit: false };
}

export function launchBrowser() {
  return chromium.launch();
}

export async function captureScreenshot(browser, url) {
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "load", timeout: NAV_TIMEOUT });
    await page.waitForTimeout(WAIT_AFTER_LOAD);
    await dismissCookieBanner(page).catch(() => {});
    await page.addStyleTag({ content: HIDE_COOKIE_CSS }).catch(() => {});
    const raw = await page.screenshot({ fullPage: false, type: "png" });
    return compressUnderLimit(raw);
  } finally {
    await context.close();
  }
}
