import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3210';
const shots = [
  { name: '01-home-tr-dark',  url: '/tr',               w: 390,  h: 844, theme: 'dark'  },
  { name: '02-menu-tr-dark',  url: '/tr/menu',          w: 390,  h: 844, theme: 'dark'  },
  { name: '03-menu-en-light', url: '/en/menu',          w: 390,  h: 844, theme: 'light' },
  { name: '04-home-tr-light', url: '/tr',               w: 390,  h: 844, theme: 'light' },
  { name: '05-desktop-menu',  url: '/tr/menu',          w: 1440, h: 900, theme: 'dark'  },
  { name: '06-table-qr',      url: '/tr/menu?table=12', w: 390,  h: 844, theme: 'dark'  },
];

const browser = await chromium.launch();
const errors = [];
for (const s of shots) {
  const ctx = await browser.newContext({
    viewport: { width: s.w, height: s.h }, colorScheme: s.theme, deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(`[${s.name}] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[${s.name}] PAGEERROR ${e.message}`));
  const res = await page.goto(BASE + s.url, { waitUntil: 'networkidle', timeout: 45000 });
  if (res && res.status() >= 400) errors.push(`[${s.name}] HTTP ${res.status()}`);
  // Webfonts swap in after paint; screenshotting before they settle captures
  // fallback metrics and makes correct markup look broken.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `/tmp/shots/${s.name}.png` });
  console.log(`  ${s.name.padEnd(20)} ${res?.status()} ${s.w}x${s.h} ${s.theme}`);
  await ctx.close();
}
await browser.close();
console.log('\nconsole errors:', errors.length ? '\n  ' + errors.join('\n  ') : 'none');
if (errors.length) process.exit(1);
