import { chromium } from '@playwright/test';
const URL = "https://mist-menu-git-claude-cafe-menu-16e3db-erfans-projects-89274a0b.vercel.app";
// Outbound HTTPS in this environment goes through an agent proxy. curl picks
// it up from the environment; Chromium needs it passed explicitly.
const proxy = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
const b = await chromium.launch(
  proxy ? { proxy: { server: proxy }, args: ["--ignore-certificate-errors"] } : {},
);
let fail = 0;
const check = (ok, label, detail='') => { console.log(`  ${ok?'✓':'✗'} ${label}${detail?` — ${detail}`:''}`); if(!ok) fail++; };

const ctx = await b.newContext({ viewport:{width:1280,height:900} });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));

// Vercel Deployment Protection sends anonymous visitors to an SSO login, so
// this check only runs where a bypass token is configured.
const probe = await fetch(`${URL}/tr/menu`, { redirect: 'manual' });
if ([302, 307, 401].includes(probe.status)) {
  console.log(`\n  ⊘ skipped — preview is behind Vercel Deployment Protection (HTTP ${probe.status})`);
  console.log('    Set a protection bypass to run this against the deployment.\n');
  await b.close();
  process.exit(0);
}

console.log('\nCUSTOMER APP ON VERCEL (no backend configured)');
await page.goto(`${URL}/tr/menu`, { waitUntil:'networkidle', timeout:60000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);
const cards = await page.locator('article').count();
check(cards > 0, 'menu renders from the static dataset', `${cards} cards`);
check(await page.locator('nav button[aria-label^="Sepet"]').count() > 0, 'bottom hub present');
await page.screenshot({ path:'/tmp/shots/30-vercel-menu.png' });

console.log('\nADMIN ON VERCEL (should refuse, not fake)');
await page.goto(`${URL}/tr/admin/kds`, { waitUntil:'networkidle', timeout:60000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);
const refused = await page.getByText('Backend not configured').count() > 0;
check(refused, 'admin shows the backend-required state');
check(await page.getByText('Mutfak Panosu').count() === 0, 'no fake kitchen board is rendered');
check(await page.getByText('Personel Girişi').count() === 0, 'no login form offered without a backend');
await page.screenshot({ path:'/tmp/shots/31-vercel-admin.png' });

check(errs.length === 0, 'no page errors', errs.slice(0,2).join('; '));
await b.close();
console.log(fail === 0 ? '\nPASS\n' : `\nFAIL — ${fail}\n`);
process.exit(fail === 0 ? 0 : 1);
