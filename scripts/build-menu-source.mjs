#!/usr/bin/env node
/**
 * One-shot migration: two drifting Turkish/English menu modules -> one
 * canonical, localized, machine-checkable dataset.
 *
 *   src/data/menu.js    (TR: 31 categories, 251 items, prices as "₺1.300")
 *   src/data/menuEn.js  (EN: 31 categories, 250 items, NO image on any item)
 *        -> data/menu.source.json
 *
 * Output is committed. The app never runs this; it is kept for auditability
 * and so the transform can be re-run if the legacy files are ever revisited.
 *
 * Run: node scripts/build-menu-source.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(ROOT, ...s);

/* ── Turkish-aware folding (mirrors src/lib/i18n/fold.ts) ──────────────── */
const TR_MAP = { ı:"i", İ:"i", ş:"s", Ş:"s", ğ:"g", Ğ:"g", ü:"u", Ü:"u",
                 ö:"o", Ö:"o", ç:"c", Ç:"c", â:"a", î:"i", û:"u" };
const foldTr = (s) =>
  s.toLocaleLowerCase("tr-TR")
   .replace(/[ıİşŞğĞüÜöÖçÇâîû]/g, (c) => TR_MAP[c] ?? c)
   .normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
const slugify = (s) =>
  foldTr(s).replace(/&/g, " ve ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/* ── Load the ESM data modules without a transpiler ────────────────────── */
async function load(file) {
  return import("file://" + p(file));
}

/* ── Price: "₺1.300" -> 130000 kuruş ───────────────────────────────────── */
function toMinor(price, ctx) {
  const cleaned = String(price).replace(/[₺\s]/g, "").replace(/\./g, "").replace(",", ".");
  const lira = Number(cleaned);
  if (!Number.isFinite(lira) || lira <= 0) throw new Error(`Unparseable price "${price}" at ${ctx}`);
  const minor = Math.round(lira * 100);
  if (!Number.isInteger(minor)) throw new Error(`Non-integer minor for "${price}" at ${ctx}`);
  return minor;
}

/* ── Variants: an explicit allow-list, never a heuristic ────────────────
   A "3+ comma-separated clauses" rule flags 42 items, but most are
   ingredient lists ("Kaşar peyniri, yumurta, mevsim salatası") which must
   stay as prose. Only these genuinely encode a customer choice.           */
const VARIANTS = {
  "cheesecake":            { sep: ",",     group: { tr: "Çeşit",    en: "Variety" } },
  "magnolia-meyveli":      { sep: " veya ",group: { tr: "Çeşit",    en: "Variety" } },
  "meyveli-soda":          { sep: ",",     group: { tr: "Aroma",    en: "Flavour" } },
  "cappy":                 { sep: ",",     group: { tr: "Aroma",    en: "Flavour" } },
  "fuse-tea":              { sep: ",",     group: { tr: "Aroma",    en: "Flavour" } },
  "redbull":               { sep: ",",     group: { tr: "Çeşit",    en: "Variety" } },
  "sut":                   { sep: ",",     group: { tr: "Sıcaklık", en: "Temperature" } },
  "aromali-sut":           { sep: ",",     group: { tr: "Sıcaklık", en: "Temperature" } },
  "dozaj-dark":            { sep: ",",     group: { tr: "Aroma",    en: "Flavour" } },
  "must-have":             { sep: ",",     group: { tr: "Aroma",    en: "Flavour" } },
  "natural":               { sep: ",",     group: { tr: "Aroma",    en: "Flavour" } },
  "manterra":              { sep: ",",     group: { tr: "Aroma",    en: "Flavour" } },
  "adalya":                { sep: ",",     group: { tr: "Aroma",    en: "Flavour" } },
  "nakhla":                { sep: ",",     group: { tr: "Aroma",    en: "Flavour" } },
  "al-fakher":             { sep: ",",     group: { tr: "Aroma",    en: "Flavour" } },
  "mist-premium":          { sep: ",",     group: { tr: "Aroma",    en: "Flavour" } },
  "karisimlar":            { sep: ",",     group: { tr: "Aroma",    en: "Flavour" } },
};

/* ── The one item English lost entirely ─────────────────────────────────── */
const EN_BACKFILL = {
  "karisik-pizza": {
    name: "Assorted Pizza",
    description:
      "Sujuk, tomato, onion, chicken, mixed peppers, jalapeño, cheddar, mozzarella, BBQ sauce",
  },
};

/* ── Dietary tags: derived from auditable rules, not guessed ───────────── */
const MEAT = /sucuk|salam|jambon|tavuk|bonfile|dana|köfte|sosis|kavurma|et\b|etli|fajita|bacon|ton balığı|hindi/i;
const DAIRY_EGG = /peynir|süt|kaymak|krema|tereyağ|yoğurt|yumurta|ayran|dondurma|hellim|kaşar|mozzarella|cheddar/i;
// 'pul biber' is a table seasoning present in plainly mild Turkish dishes,
// so it is deliberately not a spice signal.
const SPICY = /acı|jalapeno|jalapeño|cajun|arabiata|chilli|chili/i;
const CAFFEINE_CATS = new Set([
  "espresso-bazli-kahveler","filtre-kahveler","turk-kahveleri","soguk-kahveler","cay",
]);

function deriveTags(item, categorySlug) {
  const hay = `${item.name} ${item.description ?? ""}`;
  const tags = [];
  if (categorySlug === "nargileler") return tags;           // not food
  if (categorySlug === "vegan") tags.push("vegan", "vegetarian");
  else if (!MEAT.test(hay)) {
    if (!DAIRY_EGG.test(hay) && /salata|meyve|sebze|limonata|smoothie|frozen|çay|soda|su\b/i.test(hay))
      tags.push("vegan", "vegetarian");
    else if (DAIRY_EGG.test(hay)) tags.push("vegetarian");
  }
  if (SPICY.test(hay)) tags.push("spicy");
  if (CAFFEINE_CATS.has(categorySlug)) tags.push("caffeine");
  if (/mist özel|mist special/i.test(item.name)) tags.push("chefs-choice");
  return [...new Set(tags)];
}

/* ── Imagery: the cafe's own photography, catalogued in Phase 0 ────────── */
const photoManifest = JSON.parse(readFileSync(p("data/photo-manifest.json"), "utf8"));
const housePhotos = photoManifest.photos.filter((ph) => ph.categorySlug);
const byCategory = new Map();
for (const ph of housePhotos) {
  if (!byCategory.has(ph.categorySlug)) byCategory.set(ph.categorySlug, []);
  byCategory.get(ph.categorySlug).push(ph);
}

/** Stock fallbacks, one hand-picked Unsplash photo id per category. */
const STOCK = JSON.parse(readFileSync(p("scripts/stock-photos.json"), "utf8"));

function pickImage(categorySlug, itemIndex, nameTr, nameEn) {
  const pool = byCategory.get(categorySlug) ?? [];
  if (pool.length) {
    const ph = pool[itemIndex % pool.length];
    return { source: "house", src: ph.file, alt: { tr: nameTr, en: nameEn } };
  }
  const stock = STOCK[categorySlug];
  if (stock) {
    return {
      source: "stock",
      src: `https://images.unsplash.com/photo-${stock}?w=800&q=80&fm=webp&fit=crop`,
      alt: { tr: nameTr, en: nameEn },
    };
  }
  return { source: "none", src: "", alt: { tr: nameTr, en: nameEn } };
}

/* ── Build ──────────────────────────────────────────────────────────────── */
const fail = (msg) => { console.error(`\n  ✗ ${msg}\n`); process.exit(1); };

const tr = await load("src/data/menu.js");
const en = await load("src/data/menuEn.js");
const { menuGroups, menuData } = tr;
const { menuGroupsEN, menuDataEN } = en;

/* Invariants — the transform is only safe while these hold. */
if (menuGroups.length !== menuGroupsEN.length) fail("group count differs between locales");
menuGroups.forEach((g, i) => {
  if (g.id !== menuGroupsEN[i].id) fail(`group id mismatch at ${i}: ${g.id} vs ${menuGroupsEN[i].id}`);
});
if (menuData.length !== 31) fail(`expected 31 TR categories, found ${menuData.length}`);
if (menuDataEN.length !== 31) fail(`expected 31 EN categories, found ${menuDataEN.length}`);

const groupOfCategory = new Map();
menuGroups.forEach((g) => g.categories.forEach((c) => groupOfCategory.set(c, g.id)));

const groups = menuGroups.map((g, i) => ({
  slug: g.id,
  name: { tr: g.label, en: menuGroupsEN[i].label },
  icon: g.icon,
  sortOrder: i,
}));

const CATEGORY_ICONS = {
  kahvalti:"🍳", omlet:"🍳", menemen:"🍅", gozleme:"🥞", tost:"🥪", bowl:"🥗",
  salatalar:"🥬", sandvic:"🥖", "wrap-ve-quesedilla":"🌯", vegan:"🌱", aperatifler:"🍟",
  burgerler:"🍔", "makarna-ve-noodes":"🍝", pizzalar:"🍕", "beyaz-etler":"🍗",
  "kirmizi-etler":"🥩", tatlilar:"🍰", cay:"🫖", "soft-icecekler":"🥤",
  "espresso-bazli-kahveler":"☕", "filtre-kahveler":"☕", "redbull-kokteylleri":"⚡",
  "sicak-icecekler":"🍵", "soguk-kahveler":"🧋", "ev-yapimi-sikmalar":"🍊",
  "turk-kahveleri":"☕", milkshake:"🥤", frozen:"🧊", "smoothie-cesitleri":"🍓",
  "mist-ozel-kokteyller":"🍹", nargileler:"💨",
};

const seenItemSlugs = new Set();
let itemsTr = 0, itemsEn = 0, backfilled = 0, variantised = 0, house = 0, stock = 0, noImage = 0;

const categories = menuData.map((cat, ci) => {
  const enCat = menuDataEN[ci];
  const categorySlug = slugify(cat.category);
  itemsTr += cat.items.length;
  itemsEn += enCat.items.length;

  const items = cat.items.map((item, ii) => {
    const enItem = enCat.items[ii];
    const itemSlug = slugify(item.name);
    const key = `${categorySlug}/${itemSlug}`;
    if (seenItemSlugs.has(key)) fail(`duplicate slug ${key}`);
    seenItemSlugs.add(key);

    let nameEn = enItem?.name;
    let descEn = enItem?.description ?? "";
    if (!nameEn) {
      const fb = EN_BACKFILL[itemSlug];
      if (!fb) fail(`no English counterpart and no backfill for ${key}`);
      nameEn = fb.name; descEn = fb.description; backfilled++;
    }

    const priceMinor = toMinor(item.price, key);
    if (enItem && toMinor(enItem.price, key) !== priceMinor)
      fail(`price mismatch between locales at ${key}`);

    /* Variants, where the description is really a choice list. */
    let descTr = item.description ?? "";
    const modifierGroups = [];
    const spec = VARIANTS[itemSlug];
    if (spec && descTr) {
      const trOpts = descTr.split(spec.sep).map((s) => s.trim()).filter(Boolean);
      const enOpts = descEn.split(spec.sep).map((s) => s.trim()).filter(Boolean);
      if (trOpts.length > 1) {
        modifierGroups.push({
          slug: `${itemSlug}-${slugify(spec.group.en)}`,
          name: spec.group,
          selection: "single", isRequired: true, minSelect: 1, maxSelect: 1, sortOrder: 0,
          options: trOpts.map((opt, oi) => ({
            slug: slugify(opt),
            name: { tr: opt, en: enOpts.length === trOpts.length ? enOpts[oi] : opt },
            priceDeltaMinor: 0, isDefault: oi === 0, isAvailable: true, sortOrder: oi,
          })),
        });
        descTr = ""; descEn = "";     // the description WAS the option list
        variantised++;
      }
    }

    const image = pickImage(categorySlug, ii, item.name, nameEn);
    if (image.source === "house") house++; else if (image.source === "stock") stock++; else noImage++;

    return {
      slug: itemSlug, categorySlug,
      name: { tr: item.name, en: nameEn },
      description: { tr: descTr, en: descEn },
      priceMinor, image,
      tags: deriveTags(item, categorySlug),
      allergens: [],                 // never inferred — see src/types/menu.ts
      modifierGroups,
      isAvailable: true, sortOrder: ii,
      searchBlob: {
        tr: foldTr(`${item.name} ${descTr} ${cat.category}`),
        en: foldTr(`${nameEn} ${descEn} ${enCat.category}`),
      },
    };
  });

  return {
    slug: categorySlug,
    groupSlug: groupOfCategory.get(cat.category) ?? "mains",
    name: { tr: cat.category, en: enCat.category },
    icon: CATEGORY_ICONS[categorySlug] ?? "🍽️",
    sortOrder: ci,
    items,
  };
});

/* Post-conditions. */
const total = categories.reduce((n, c) => n + c.items.length, 0);
if (total !== 251) fail(`expected 251 items, produced ${total}`);
if (categories.length !== 31) fail(`expected 31 categories, produced ${categories.length}`);
for (const c of categories)
  if (!groups.some((g) => g.slug === c.groupSlug)) fail(`category ${c.slug} points at unknown group ${c.groupSlug}`);

const doc = {
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  currency: "TRY",
  allergenDataAvailable: false,
  calorieDataAvailable: false,
  groups,
  categories,
};

if (!existsSync(p("data"))) mkdirSync(p("data"));
writeFileSync(p("data/menu.source.json"), JSON.stringify(doc, null, 2) + "\n");

console.log(`
  ✓ data/menu.source.json

    groups           ${groups.length}
    categories       ${categories.length}
    items            ${total}   (TR ${itemsTr} / EN ${itemsEn} in source)
    English restored ${backfilled}
    variant groups   ${variantised}
    images           ${house} house · ${stock} stock · ${noImage} none
    allergens        omitted — absent from source, never inferred
`);
