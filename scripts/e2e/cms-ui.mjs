import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const WEB = process.env.WEB_URL ?? 'http://localhost:3260';
const API = process.env.API_URL ?? 'http://localhost:5080';
const PW = readFileSync('/tmp/admin-pw','utf8').trim();
let fail=0; const check=(ok,l,d='')=>{console.log(`  ${ok?'✓':'✗'} ${l}${d?` — ${d}`:''}`); if(!ok)fail++;};

const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:1000},colorScheme:'dark',deviceScaleFactor:2})).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});

await p.goto(`${WEB}/tr/admin/menu`,{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready);
if (await p.getByPlaceholder('E-posta').count()) {
  await p.getByPlaceholder('E-posta').fill('admin@mistcafe.local');
  await p.getByPlaceholder('Şifre').fill(PW);
  await p.getByRole('button',{name:/Giriş/}).click();
  await p.waitForTimeout(2500);
}

console.log('\nMENU MANAGER');
check(await p.getByText('Menü Yönetimi').isVisible(), 'CMS renders');
const rowCount = await p.locator('ul li').count();
check(rowCount > 0, 'category items listed', `${rowCount} rows`);

console.log('\nSOLD-OUT TOGGLE REACHES THE PUBLIC MENU');
const firstName = (await p.locator('ul li span').first().textContent())?.trim();
await p.locator('ul li button[aria-label*="tükendi olarak işaretle"]').first().click();
await p.waitForTimeout(1500);
check(await p.getByText('Tükendi').first().isVisible(), 'row marked sold out in the UI');

const menu = await (await fetch(`${API}/api/v1/menu`)).json();
const soldOut = menu.categories.flatMap(c=>c.items).filter(i=>!i.isAvailable);
check(soldOut.length > 0, 'public menu reflects it without a TTL wait',
      soldOut.map(i=>i.name.tr).slice(0,2).join(', '));

// restore
await p.locator('ul li button[aria-label*="stoğa al"]').first().click();
await p.waitForTimeout(1200);

console.log('\nEDITOR');
await p.locator('ul li button[aria-label*="düzenle"]').first().click();
await p.waitForTimeout(900);
check(await p.getByText('Fiyat (₺)').isVisible(), 'editor opens with a price field');
check(await p.getByText('Etiketler').isVisible(), 'dietary tags editable');
const allergenField = await p.getByText(/Alerjen/i).count();
check(allergenField === 0, 'allergens are not free-text editable', 'guessed values must not become claims');

await p.screenshot({path:'/tmp/shots/50-cms.png', fullPage:true});
check(errs.length===0,'no page errors',errs.slice(0,2).join('; '));
await b.close();
console.log(fail===0?'\nPASS\n':`\nFAIL — ${fail}\n`);
process.exit(fail===0?0:1);
