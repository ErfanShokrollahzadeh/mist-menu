import { chromium } from '@playwright/test';
const WEB = process.env.WEB_URL ?? 'http://localhost:3214';
const b = await chromium.launch();
const shots = [
  { name: '10-tray',     label: 'Sepet',        theme: 'dark',  seed: true },
  { name: '11-waiter',   label: 'Garson Çağır', theme: 'dark',  seed: false },
  { name: '12-wifi',     label: 'Wi-Fi',        theme: 'light', seed: false },
  { name: '13-bill',     label: 'Hesap',        theme: 'light', seed: false },
];
for (const s of shots) {
  const ctx = await b.newContext({ viewport:{width:390,height:844}, colorScheme:s.theme, deviceScaleFactor:2 });
  const p = await ctx.newPage();
  await p.goto(`${WEB}/tr/menu?table=19`, { waitUntil:'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  if (s.seed) {
    for (let i = 0; i < 2; i++) {
      await p.locator('article button[aria-label^="Sepete Ekle"]').nth(i).click();
      await p.waitForTimeout(500);
    }
  }
  await p.locator(`nav button[aria-label^="${s.label}"]`).first().click();
  await p.waitForTimeout(1400);
  await p.screenshot({ path:`/tmp/shots/${s.name}.png` });
  console.log(`  ${s.name} (${s.theme})`);
  await ctx.close();
}
await b.close();
