import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const WEB = process.env.WEB_URL ?? 'http://localhost:3250';
const PW = readFileSync('/tmp/admin-pw','utf8').trim();
let fail=0; const check=(ok,l,d='')=>{console.log(`  ${ok?'✓':'✗'} ${l}${d?` — ${d}`:''}`); if(!ok)fail++;};

const b = await chromium.launch();
for (const theme of ['dark','light']) {
  const ctx = await b.newContext({ viewport:{width:1440,height:1000}, colorScheme:theme, deviceScaleFactor:2 });
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});

  await p.goto(`${WEB}/tr/admin`, { waitUntil:'networkidle' });
  await p.evaluate(()=>document.fonts.ready);
  if (await p.getByPlaceholder('E-posta').count()) {
    await p.getByPlaceholder('E-posta').fill('admin@mistcafe.local');
    await p.getByPlaceholder('Şifre').fill(PW);
    await p.getByRole('button',{name:/Giriş/}).click();
  }
  await p.waitForTimeout(3000);

  if (theme === 'dark') {
    console.log('\nDASHBOARD');
    check(await p.getByText('Satış Raporu').isVisible(), 'dashboard renders');
    check(await p.getByText('Ciro').first().isVisible(), 'stat tiles present');
    check(await p.locator('svg[role="img"]').count() > 0, 'revenue chart rendered');
    check(await p.getByText('Yoğun Saatler').isVisible(), 'heatmap section present');
    check(await p.getByText('En Çok Satanlar').isVisible(), 'top sellers present');

    console.log('\nACCESSIBILITY OBLIGATIONS');
    await p.getByRole('button',{name:'Tablo'}).click();
    await p.waitForTimeout(600);
    check(await p.locator('table caption').count() > 0, 'heatmap has a table view with a caption');
    await p.getByRole('button',{name:'Isı haritası'}).click();
    await p.waitForTimeout(400);

    console.log('\nHEATMAP COVERS THE WHOLE DAY');
    // The café trades 10:00–06:00. A window that stopped at 23:00 — or that
    // included a non-existent hour 24 — would silently drop real orders.
    const cells = await p.locator('button[aria-label*=":00 —"]').count();
    check(cells === 7 * 24, 'every day × hour cell is rendered', `${cells} of ${7*24}`);
    const past = await p.locator('button[aria-label^="Paz 1:00"]').count();
    check(past === 1, 'post-midnight hours have a cell');
    const bogus = await p.locator('button[aria-label*="24:00"]').count();
    check(bogus === 0, 'no hour-24 column');

    console.log('\nNO DUAL AXIS');
    const axes = await p.locator('svg[role="img"] text').allTextContents();
    check(!axes.some(t=>/sipariş/i.test(t)), 'revenue chart carries a single measure');
  }
  await p.screenshot({ path:`/tmp/shots/40-dashboard-${theme}.png`, fullPage:true });
  console.log(`  screenshot: ${theme}`);
  check(errs.length===0, `no page errors (${theme})`, errs.slice(0,2).join('; '));
  await ctx.close();
}
await b.close();
console.log(fail===0?'\nPASS\n':`\nFAIL — ${fail}\n`);
process.exit(fail===0?0:1);
