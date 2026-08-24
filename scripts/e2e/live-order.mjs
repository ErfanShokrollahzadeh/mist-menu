#!/usr/bin/env node
/**
 * Drives the real UI against the real API: browse -> add to tray -> checkout,
 * then asserts the order actually landed in Postgres via the API.
 */
import { chromium } from '@playwright/test';

const WEB = process.env.WEB_URL ?? 'http://localhost:3212';
const API = process.env.API_URL ?? 'http://localhost:5080';
const TABLE = '19';

let failures = 0;
const check = (ok, label, detail = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

const before = await (await fetch(`${API}/api/v1/tables/${TABLE}/orders/active`)).json();

// CORS is the classic silent failure here: the POST is blocked in the browser
// and the only symptom is an order that never arrives.
const preflight = await fetch(`${API}/api/v1/orders`, {
  method: 'OPTIONS',
  headers: {
    Origin: WEB,
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type',
  },
});
check(preflight.headers.get('access-control-allow-origin') === WEB,
      'API allows the web origin', `Cors:Origins must list ${WEB}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

try {
  // QR entry point binds the table.
  await page.goto(`${WEB}/tr/menu?table=${TABLE}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  check(true, 'menu loaded from the QR link');

  const badge = await page.getByText(`Masa ${TABLE}`).first().isVisible().catch(() => false);
  check(badge, 'table detected from ?table= param', `Masa ${TABLE}`);

  // Turkish search must match despite the dotted capital I.
  await page.getByRole('searchbox').fill('içecek');
  await page.waitForTimeout(700);
  const hits = await page.locator('article').count();
  check(hits > 0, 'Turkish search "içecek" returns results', `${hits} cards`);

  await page.getByRole('searchbox').fill('');
  await page.waitForTimeout(500);

  // Quick-add the first item that has no required choices.
  const addButtons = page.locator('article button[aria-label^="Sepete Ekle"]');
  await addButtons.first().click();
  await page.waitForTimeout(900);
  check(true, 'item added to tray');

  // Open the tray from the bottom hub and place the order.
  await page.locator('nav button[aria-label^="Sepet"]').first().click();
  await page.waitForTimeout(900);
  const placeBtn = page.getByRole('button', { name: 'Siparişi Gönder' });
  check(await placeBtn.isVisible(), 'tray sheet open with checkout available');
  await placeBtn.click();
  await page.waitForTimeout(2500);
} catch (err) {
  check(false, 'ui flow', err.message);
} finally {
  await page.screenshot({ path: '/tmp/shots/07-live-order.png' });
  await browser.close();
}

const after = await (await fetch(`${API}/api/v1/tables/${TABLE}/orders/active`)).json();
check(after.length === before.length + 1, 'order persisted through the real API',
      `${before.length} -> ${after.length} active orders`);
if (after.length) {
  const o = after[after.length - 1];
  check(o.simulated === false, 'order is real, not simulated', `#${o.orderNumber}, ${o.totalMinor / 100} TRY`);
}
check(errors.length === 0, 'no page errors', errors.slice(0, 2).join('; '));

console.log(failures === 0 ? '\nPASS\n' : `\nFAIL — ${failures} check(s)\n`);
process.exit(failures === 0 ? 0 : 1);
