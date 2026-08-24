#!/usr/bin/env node
/** Integrity gate for data/menu.source.json. Exits non-zero on any failure. */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Fuse from "fuse.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const doc = JSON.parse(readFileSync(join(ROOT, "data/menu.source.json"), "utf8"));

const TR_MAP = { ı:"i", İ:"i", ş:"s", Ş:"s", ğ:"g", Ğ:"g", ü:"u", Ü:"u", ö:"o", Ö:"o", ç:"c", Ç:"c", â:"a", î:"i", û:"u" };
const foldTr = (s) => s.toLocaleLowerCase("tr-TR")
  .replace(/[ıİşŞğĞüÜöÖçÇâîû]/g, (c) => TR_MAP[c] ?? c)
  .normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();

let failures = 0;
const check = (name, cond, detail = "") => {
  if (cond) console.log(`  ✓ ${name}`);
  else { console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`); failures++; }
};

const items = doc.categories.flatMap((c) => c.items);

console.log("\nSTRUCTURE");
check("6 groups", doc.groups.length === 6, `got ${doc.groups.length}`);
check("31 categories", doc.categories.length === 31, `got ${doc.categories.length}`);
check("251 items", items.length === 251, `got ${items.length}`);
check("every category belongs to a real group",
  doc.categories.every((c) => doc.groups.some((g) => g.slug === c.groupSlug)));

console.log("\nIDENTITY");
const keys = items.map((i) => `${i.categorySlug}/${i.slug}`);
check("item slugs unique", new Set(keys).size === keys.length,
  `${keys.length - new Set(keys).size} collisions`);
check("category slugs unique", new Set(doc.categories.map((c) => c.slug)).size === 31);

console.log("\nLOCALISATION");
check("every item named in TR and EN",
  items.every((i) => i.name.tr.trim() && i.name.en.trim()));
check("every category named in TR and EN",
  doc.categories.every((c) => c.name.tr.trim() && c.name.en.trim()));
check("every item has a search blob in both locales",
  items.every((i) => i.searchBlob.tr && i.searchBlob.en));

console.log("\nMONEY");
check("all prices are positive integers (kuruş)",
  items.every((i) => Number.isInteger(i.priceMinor) && i.priceMinor > 0));
check("no price is a float", items.every((i) => !String(i.priceMinor).includes(".")));

console.log("\nIMAGERY");
check("no loremflickr placeholders survive",
  !JSON.stringify(doc).includes("loremflickr"));
check("every item has an image", items.every((i) => i.image.src));
const houseMissing = items
  .filter((i) => i.image.source === "house")
  .filter((i) => !existsSync(join(ROOT, "public", i.image.src)));
check("every house photo exists on disk", houseMissing.length === 0,
  houseMissing.slice(0, 3).map((i) => i.image.src).join(", "));
check("stock images point at unsplash",
  items.filter((i) => i.image.source === "stock")
       .every((i) => i.image.src.startsWith("https://images.unsplash.com/")));

console.log("\nMODIFIERS");
const mgs = items.flatMap((i) => i.modifierGroups);
check("17 variant groups extracted", mgs.length === 17, `got ${mgs.length}`);
check("every group has ≥2 options", mgs.every((g) => g.options.length >= 2));
check("every group has exactly one default",
  mgs.every((g) => g.options.filter((o) => o.isDefault).length === 1));
check("variantised items no longer repeat options as prose",
  items.filter((i) => i.modifierGroups.length).every((i) => !i.description.tr.trim()));

console.log("\nHONESTY");
check("allergen data flagged unavailable", doc.allergenDataAvailable === false);
check("no allergens invented", items.every((i) => i.allergens.length === 0));
check("no calories invented", items.every((i) => i.calories === undefined));

console.log("\nTURKISH SEARCH (the bug the previous build shipped)");
const naive = "İÇECEKLER".toLowerCase().includes("içecek");
check("naive toLowerCase() genuinely fails on İ", naive === false);
check("foldTr fixes it", foldTr("İÇECEKLER").includes(foldTr("içecek")));
check("foldTr('Kahvaltı') matches ascii 'kahvalti'", foldTr("Kahvaltı") === "kahvalti");

const fuse = new Fuse(items.map((i) => ({ i, h: i.searchBlob.tr })),
  { keys: ["h"], threshold: 0.34, ignoreLocation: true, minMatchCharLength: 2 });
const hits = (q) => fuse.search(foldTr(q)).map((r) => r.item.i.name.tr);
for (const [q, expect] of [["içecek", "İçecekler category items"], ["kahvalti", "breakfast"], ["SAHLEP", "Sahlep"], ["cheesecake", "Cheesecake"]]) {
  const r = hits(q);
  check(`search "${q}" returns results (${expect})`, r.length > 0, "0 hits");
}

console.log(`\n${failures === 0 ? "PASS" : `FAIL — ${failures} check(s)`}\n`);
process.exit(failures === 0 ? 0 : 1);
