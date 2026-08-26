/** Sequential ramps are judged on lightness monotonicity + contrast at the
 *  signal end, not on the categorical adjacent-pair rules. */
const srgb = (h) => [1,3,5].map(i => parseInt(h.slice(i,i+2),16)/255);
const lin = (c) => c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055)**2.4;
const lum = (h) => { const [r,g,b]=srgb(h).map(lin); return 0.2126*r+0.7152*g+0.0722*b; };
const contrast = (a,b) => { const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p); return (x+0.05)/(y+0.05); };

const check = (name, ramp, surface) => {
  const Ls = ramp.map(lum);
  const mono = Ls.every((l,i) => i===0 || l < Ls[i-1]) || Ls.every((l,i) => i===0 || l > Ls[i-1]);
  const cs = ramp.map(h => +contrast(h,surface).toFixed(2));
  const signal = cs[cs.length-1];                       // the high-value end
  console.log(`\n${name}  (surface ${surface})`);
  console.log(`  monotonic lightness : ${mono ? "PASS" : "FAIL"}`);
  console.log(`  contrast per step   : ${cs.join(", ")}`);
  console.log(`  signal end ≥ 3:1    : ${signal >= 3 ? "PASS" : "FAIL"} (${signal}:1)`);
  const low = ramp.filter((h,i) => cs[i] < 3);
  if (low.length) console.log(`  low end < 3:1       : ${low.length} step(s) → require labels + table view`);
  return mono && signal >= 3;
};

const LIGHT = ["#eff6ff","#bcdcff","#8ec6ff","#59a6ff","#2563eb"];
const DARK  = ["#11224a","#1d4ed8","#3b82f6","#59a6ff","#8ec6ff"];
const ok1 = check("Sequential — light mode", LIGHT, "#f6f8fc");
const ok2 = check("Sequential — dark mode (own steps, not a flip)", DARK, "#080c15");

console.log("\nLine series (single, no legend needed)");
for (const [mode,c,s] of [["light","#2563eb","#f6f8fc"],["dark","#59a6ff","#080c15"]]) {
  const v = +contrast(c,s).toFixed(2);
  console.log(`  ${mode.padEnd(5)} ${c} vs ${s} → ${v}:1  ${v>=3?"PASS":"FAIL"}`);
}
process.exit(ok1 && ok2 ? 0 : 1);
