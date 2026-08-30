import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { chromium } from "@playwright/test";

/**
 * Guards the one real hazard of translucent chrome: the bottom bar is glass
 * over arbitrary food photography, so its labels sit on whatever happens to be
 * behind them. Measured over a bright dish, the body-copy grey fell to 2.87:1.
 *
 * Samples the *mean* composited background across each label's box (which is
 * what antialiased text actually reads against) at several scroll positions,
 * with the glyphs made transparent so only the material is measured. It waits
 * for the bar to finish expanding first — sampling mid-transition reads
 * half-collapsed labels overlapping the icons and swings wildly.
 */
const sharp = createRequire(import.meta.url)("sharp");
function cp(){const r="/opt/pw-browsers";const d=readdirSync(r).find(x=>/^chromium-\d+$/.test(x));const b=d&&join(r,d,"chrome-linux","chrome");return b&&existsSync(b)?b:undefined;}
const lin=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
const L=([r,g,b])=>0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);
const cr=(a,b)=>{const l1=L(a),l2=L(b);return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);};
const hx=h=>{h=h.replace("#","");return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));};

const WEB = process.env.WEB_URL ?? "http://localhost:3000";
let failed = 0;
const B=await chromium.launch({executablePath:cp(),args:["--no-sandbox","--disable-dev-shm-usage"]});
for (const theme of ["dark","light"]) {
  const ctx=await B.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
  await ctx.addInitScript(t=>{try{localStorage.setItem("mist.theme",t)}catch{}},theme);
  const p=await ctx.newPage();
  await p.goto(WEB + "/tr/menu",{waitUntil:"load"});
  await p.waitForSelector("article");
  await p.waitForFunction(()=>[...document.images].filter(i=>i.complete).length>=Math.min(10,document.images.length),null,{timeout:20000}).catch(()=>{});
  await p.waitForTimeout(2500);
  const muted = await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue("--ink").trim());
  const fg = hx(muted.startsWith("#")?muted:"#e5e7eb");
  // make label glyphs transparent once, so every sample reads the material only
  await p.evaluate(()=>{document.querySelectorAll('nav[aria-label] span').forEach(s=>{if(s.children.length===0)s.style.color="transparent";});});

  let worst=99, at=-1, worstBg=null;
  for (const y of [0,600,1400,2200,3000,3800,4600]) {
    // land at y, then nudge UP so the bar is expanded (its worst case for legibility)
    await p.evaluate(v=>window.scrollTo(0,v+260), y); await p.waitForTimeout(400);
    await p.evaluate(v=>window.scrollTo(0,v), y);
    // Wait for the label row to finish expanding AND the capsule to finish
    // widening. Sampling mid-transition was reading half-collapsed labels
    // overlapping the icons, which is what made earlier runs swing wildly.
    let ok=false;
    for (let i=0;i<30;i++){
      await p.waitForTimeout(120);
      const st = await p.evaluate(()=>{
        const n=document.querySelector('nav[aria-label]');
        const cap=n.firstElementChild.getBoundingClientRect();
        const s=[...n.querySelectorAll("span")].find(x=>/^(Sepet|Hesap)/.test(x.textContent||""));
        return {h:s?s.getBoundingClientRect().height:0, w:cap.width};
      });
      if (st.h >= 9 && st.w > 340) { ok=true; break; }
    }
    if (!ok) continue;
    await p.waitForTimeout(300);
    const boxes = await p.evaluate(()=>{
      const n=document.querySelector('nav[aria-label]');
      return [...n.querySelectorAll("span")].filter(s=>/^(Sepet|Hesap|Wi-Fi|Garson)/.test(s.textContent||""))
        .map(s=>{const b=s.getBoundingClientRect();
          return {x0:Math.round(b.x),y0:Math.round(b.y),x1:Math.round(b.right),y1:Math.round(b.bottom)};});
    });
    const r = await sharp(await p.screenshot()).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const q=(x,yy)=>{const i=(yy*r.info.width+x)*r.info.channels;return [r.data[i],r.data[i+1],r.data[i+2]];};
    for(const b of boxes){
      let sr=0,sg=0,sb=0,n=0;
      for(let yy=b.y0;yy<b.y1;yy++) for(let xx=b.x0;xx<b.x1;xx++){
        const px=q(xx,yy); sr+=px[0]; sg+=px[1]; sb+=px[2]; n++;
      }
      if(!n) continue;
      const mean=[sr/n,sg/n,sb/n];
      const c=cr(fg,mean);
      if(c<worst){worst=c;at=y;worstBg=mean.map(v=>Math.round(v));}
    }
  }
  const ok = worst >= 4.5;
  if (!ok) failed++;
  console.log(`  ${ok ? "✓" : "✗"} ${theme.padEnd(5)} nav labels ${muted} worst ${worst.toFixed(2)}:1 over rgb(${worstBg}) at y=${at}`);
  await ctx.close();
}
await B.close();
console.log(failed ? `\n${failed} THEME(S) FAIL the 4.5:1 floor\n` : "\nPASS\n");
process.exit(failed ? 1 : 0);
