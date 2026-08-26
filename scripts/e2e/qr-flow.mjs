import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const WEB = process.env.WEB_URL ?? 'http://localhost:3270';
const API = process.env.API_URL ?? 'http://localhost:5080';
const PW = readFileSync('/tmp/admin-pw','utf8').trim();
let fail=0; const check=(ok,l,d='')=>{console.log(`  ${ok?'✓':'✗'} ${l}${d?` — ${d}`:''}`); if(!ok)fail++;};

const login = await (await fetch(`${API}/api/v1/auth/login`,{method:'POST',
  headers:{'content-type':'application/json'},
  body:JSON.stringify({email:'admin@mistcafe.local',password:PW})})).json();
const tables = await (await fetch(`${API}/api/v1/admin/tables`,
  {headers:{authorization:`Bearer ${login.accessToken}`}})).json();
const t = tables.find(x=>x.number==='8');

const b = await chromium.launch();

console.log('\nCUSTOMER SCANS THE PRINTED CODE');
const ctx = await b.newContext({viewport:{width:390,height:844},colorScheme:'dark'});
const p = await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(`${WEB}/tr/menu?t=${t.qrToken}`,{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready);
await p.waitForTimeout(1800);
check(await p.getByText('Masa 8').first().isVisible(), 'token resolved to the right table');

console.log('\nA FORGED TOKEN BINDS NOTHING');
const ctx2 = await b.newContext({viewport:{width:390,height:844}});
const p2 = await ctx2.newPage();
await p2.goto(`${WEB}/tr/menu?t=deadbeefdeadbeefdeadbeefdeadbeef`,{waitUntil:'networkidle'});
await p2.waitForTimeout(1500);
check(await p2.getByText(/^Masa \d+$/).count() === 0, 'no table is bound from a bogus token');
await ctx2.close();

console.log('\nCODES PRINTED BEFORE THE CHANGE STILL WORK');
const ctx3 = await b.newContext({viewport:{width:390,height:844}});
const p3 = await ctx3.newPage();
await p3.goto(`${WEB}/tr/menu?table=14`,{waitUntil:'networkidle'});
await p3.waitForTimeout(1200);
check(await p3.getByText('Masa 14').first().isVisible(), 'legacy ?table= still binds');
await ctx3.close();

console.log('\nPRINTABLE SHEET');
const ctx4 = await b.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2});
const p4 = await ctx4.newPage();
await p4.goto(`${WEB}/tr/admin/tables`,{waitUntil:'networkidle'});
if (await p4.getByPlaceholder('E-posta').count()) {
  await p4.getByPlaceholder('E-posta').fill('admin@mistcafe.local');
  await p4.getByPlaceholder('Şifre').fill(PW);
  await p4.getByRole('button',{name:/Giriş/}).click();
}
await p4.waitForTimeout(3500);
const svgs = await p4.locator('svg').count();
check(svgs >= 32, 'a QR code rendered per table', `${svgs} svg`);
await p4.screenshot({path:'/tmp/shots/60-tables.png', fullPage:true});
await p4.emulateMedia({media:'print'});
await p4.waitForTimeout(500);
const navHidden = await p4.locator('header').first().isVisible().catch(()=>false);
check(!navHidden, 'admin chrome is hidden when printing');
await p4.screenshot({path:'/tmp/shots/61-tables-print.png', fullPage:true});
await ctx4.close();

check(errs.length===0,'no page errors',errs.slice(0,2).join('; '));
await b.close();
console.log(fail===0?'\nPASS\n':`\nFAIL — ${fail}\n`);
process.exit(fail===0?0:1);
