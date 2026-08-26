#!/usr/bin/env node
/**
 * The Vercel deployment builds with NEXT_PUBLIC_API_URL unset. This asserts
 * what that build must guarantee: the customer app works entirely on the
 * static dataset, and admin refuses rather than pretending.
 */
import { chromium } from "@playwright/test";

const WEB = process.env.WEB_URL ?? "http://localhost:3240";
let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

console.log("\nCUSTOMER APP WORKS WITH NO BACKEND");
await page.goto(`${WEB}/tr/menu`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);
check(await page.locator("article").count() > 0, "menu renders from the static dataset",
      `${await page.locator("article").count()} cards`);

await page.getByRole("searchbox").fill("içecek");
await page.waitForTimeout(800);
check(await page.locator("article").count() > 0, "Turkish search still works offline of any API");
await page.getByRole("searchbox").fill("");
await page.waitForTimeout(400);

await page.locator('article button[aria-label^="Sepete Ekle"]').first().click();
await page.waitForTimeout(600);
await page.locator('nav button[aria-label^="Sepet"]').first().click();
await page.waitForTimeout(900);
check(await page.getByText("Tanıtım modu").isVisible(),
      "tray states the order will not reach a kitchen");

console.log("\nADMIN REFUSES RATHER THAN FAKING");
await page.goto(`${WEB}/tr/admin/kds`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1000);
check(await page.getByText("Backend not configured").isVisible(), "backend-required state shown");
check(await page.getByText("Mutfak Panosu").count() === 0, "no fake kitchen board rendered");
check(await page.getByText("Personel Girişi").count() === 0,
      "no login form offered when it could not succeed");
await page.screenshot({ path: "/tmp/shots/32-admin-nobackend.png" });

check(errors.length === 0, "no page errors", errors.slice(0, 2).join("; "));
await browser.close();
console.log(failures === 0 ? "\nPASS\n" : `\nFAIL — ${failures} check(s)\n`);
process.exit(failures === 0 ? 0 : 1);
