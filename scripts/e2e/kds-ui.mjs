#!/usr/bin/env node
/**
 * Drives the kitchen display through a real browser and proves the loop that
 * matters: a customer places an order, it appears on the board, staff drag it
 * forward, and the customer's own view reflects the new status.
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const WEB = process.env.WEB_URL ?? "http://localhost:3230";
const API = process.env.API_URL ?? "http://localhost:5080";
const PASSWORD = readFileSync("/tmp/admin-pw", "utf8").trim();
const TABLE = "9";

let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

try {
  console.log("\nGATE");
  await page.goto(`${WEB}/tr/admin/kds`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  check(await page.getByText("Personel Girişi").isVisible(), "unauthenticated staff see the login gate");
  await page.screenshot({ path: "/tmp/shots/20-admin-login.png" });

  console.log("\nLOGIN");
  await page.getByPlaceholder("E-posta").fill("admin@mistcafe.local");
  await page.getByPlaceholder("Şifre").fill(PASSWORD);
  await page.getByRole("button", { name: /Giriş/ }).click();
  await page.waitForTimeout(2000);
  check(await page.getByText("Mutfak Panosu").isVisible(), "board renders after login");

  console.log("\nLIVE ARRIVAL");
  const order = await (await fetch(`${API}/api/v1/orders`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({
      tableId: TABLE, locale: "tr", clientRequestId: `ui-${Date.now()}`,
      lines: [
        { categorySlug: "kahvalti", itemSlug: "sini-kahvalti", quantity: 1, selections: {}, note: "acısız" },
        { categorySlug: "cay", itemSlug: "bardak-cay", quantity: 2, selections: {}, note: null },
      ],
    }),
  })).json();
  await page.waitForTimeout(2500);
  const card = page.locator("article", { hasText: `#${order.orderNumber}` });
  check(await card.count() > 0, "new order pushed onto the board live", `#${order.orderNumber}`);
  // Scope to this run's card: earlier runs leave orders on the board.
  check(await card.first().getByText(`Masa ${TABLE}`).isVisible(), "table number shown");
  check(await card.first().getByText("acısız").isVisible(), "per-item note surfaced to the kitchen");
  await page.screenshot({ path: "/tmp/shots/21-admin-kds.png" });

  console.log("\nDRAG TO ADVANCE");
  const box = await card.first().boundingBox();
  const target = await page.locator("section", { hasText: "Hazırlanıyor" }).first().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + 120, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(2500);

  const after = await (await fetch(`${API}/api/v1/tables/${TABLE}/orders/active`)).json();
  const moved = after.find((o) => o.orderNumber === order.orderNumber);
  check(moved?.status === "preparing", "drag persisted the status change", `status=${moved?.status}`);
  await page.screenshot({ path: "/tmp/shots/22-admin-kds-moved.png" });

  console.log("\nCHROME ISOLATION");
  check(await page.locator('nav button[aria-label^="Sepet"]').count() === 0,
        "customer bottom hub absent from admin");
  check(await page.getByText("MiST CAFÉ & LOUNGE").count() === 0,
        "customer top bar absent from admin");

  console.log("\nSOUND GATE");
  check(await page.getByRole("button", { name: /Sesi aç/ }).isVisible(),
        "sound starts disarmed and says so");
} catch (err) {
  check(false, "ui flow", err.message);
} finally {
  await browser.close();
}

check(errors.length === 0, "no page errors", errors.slice(0, 2).join("; "));
console.log(failures === 0 ? "\nPASS\n" : `\nFAIL — ${failures} check(s)\n`);
process.exit(failures === 0 ? 0 : 1);
