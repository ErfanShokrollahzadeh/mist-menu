#!/usr/bin/env node
/**
 * Measures the three things the user actually complained about, under 4x CPU
 * throttling to stand in for a mid-range phone:
 *
 *   idle    main-thread ms burned over 3s with nobody touching the page.
 *           This is the ambient-drift fix: a backdrop that never stops
 *           animating re-filters every glass surface above it, forever.
 *   tab     longest blocking task when switching to the 82-card group.
 *   typing  longest blocking task while typing in search.
 *
 * Headless Chromium does less real GPU compositing than a phone, so the
 * absolute numbers understate backdrop-filter cost. The before/after ratio on
 * the same harness is the meaningful part.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

/**
 * Use the full Chromium build rather than headless_shell: it composites for
 * real, which is the whole point when the thing under test is backdrop-filter.
 */
function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
  if (!existsSync(root)) return undefined;
  const dir = readdirSync(root).find((d) => /^chromium-\d+$/.test(d));
  const bin = dir && join(root, dir, "chrome-linux", "chrome");
  return bin && existsSync(bin) ? bin : undefined;
}

const URL = process.argv[2] ?? "http://localhost:3000/tr/menu";
const LABEL = process.argv[3] ?? "run";

const OBSERVE = `
  window.__lt = [];
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(e.duration); })
      .observe({ type: "longtask", buffered: true });
  } catch {}
`;

const browser = await chromium.launch({
  executablePath: chromiumPath(),
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.addInitScript(OBSERVE);
const page = await context.newPage();

const cdp = await context.newCDPSession(page);
await cdp.send("Performance.enable");
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

const metric = async (name) => {
  const { metrics } = await cdp.send("Performance.getMetrics");
  return metrics.find((m) => m.name === name)?.value ?? 0;
};
const reset = () => page.evaluate(() => { window.__lt = []; });
const longest = () => page.evaluate(() => Math.max(0, ...(window.__lt ?? [])));
const total = () => page.evaluate(() => (window.__lt ?? []).reduce((a, b) => a + b, 0));

await page.goto(URL, { waitUntil: "load" });
await page.waitForSelector("article", { timeout: 30000 });
await page.waitForTimeout(2500); // let hydration, lazy chunks and the cascade settle

// ---- idle: nobody touches the page for 3 seconds ---------------------------
await reset();
const t0 = await metric("TaskDuration");
const s0 = await metric("RecalcStyleDuration");
const l0 = await metric("LayoutDuration");
await page.waitForTimeout(3000);
const idleTask = ((await metric("TaskDuration")) - t0) * 1000;
const idleStyle = ((await metric("RecalcStyleDuration")) - s0) * 1000;
const idleLayout = ((await metric("LayoutDuration")) - l0) * 1000;
const idleLong = await total();

// ---- tab switch to the heaviest group --------------------------------------
const tabs = page.locator('[role="tab"]');
const tabCount = await tabs.count();
await reset();
const tabStart = Date.now();
await tabs.nth(Math.min(4, tabCount - 1)).click(); // colddrinks: 8 categories, 82 cards
await page.waitForFunction(() => document.querySelectorAll("article").length > 70, null, { timeout: 30000 });
const tabMs = Date.now() - tabStart;
await page.waitForTimeout(600);
const tabLongest = await longest();
const tabTotal = await total();
const cards = await page.locator("article").count();

// ---- typing ----------------------------------------------------------------
const box = page.locator('input[type="search"], input[type="text"]').first();
await reset();
await box.click();
await box.type("kahve", { delay: 90 });
await page.waitForTimeout(900);
const typeLongest = await longest();
const typeTotal = await total();

const n = (v) => `${v.toFixed(1)}`.padStart(8);
console.log(`
=== ${LABEL} ===  (4x CPU throttle, 390x844)
  idle 3s   main-thread ${n(idleTask)} ms   style ${n(idleStyle)} ms   layout ${n(idleLayout)} ms   longtasks ${n(idleLong)} ms
  tab->82   ${n(tabMs)} ms to render ${cards} cards   longest task ${n(tabLongest)} ms   total blocking ${n(tabTotal)} ms
  typing    longest task ${n(typeLongest)} ms   total blocking ${n(typeTotal)} ms
`);

await browser.close();
