#!/usr/bin/env node
/**
 * Derives the two client-facing menu artefacts from the canonical dataset.
 *
 * `data/menu.source.json` stays the single source of truth — it is what the
 * .NET seeder reads, and it keeps every field. But importing it into a
 * `"use client"` module ships all of it to the browser, and ~18% of it by
 * weight is `searchBlob`: pre-folded haystacks that are useless to anyone who
 * never types in the search box.
 *
 * So we split it:
 *   data/menu.client.json  the menu minus searchBlob — the main bundle
 *   data/menu.search.json  just the haystacks — fetched with fuse.js on demand
 *
 * Both are generated, both are committed, and `prebuild` regenerates them so
 * they cannot drift from the source.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...parts) => join(root, ...parts);

const source = JSON.parse(readFileSync(p("data/menu.source.json"), "utf8"));

const haystacks = [];
let items = 0;

const categories = source.categories.map((category) => ({
  ...category,
  items: category.items.map((item) => {
    items++;
    const { searchBlob, ...rest } = item;
    if (!searchBlob?.tr || !searchBlob?.en) {
      throw new Error(`${category.slug}/${item.slug} is missing a searchBlob`);
    }
    // Keys are short because this array is 251 entries long.
    haystacks.push({ c: item.categorySlug, s: item.slug, tr: searchBlob.tr, en: searchBlob.en });

    /* Blur placeholders are NOT inlined here. 251 items share only 40 photos, so
       inlining duplicated each one ~6x and added 53.7 KB to the main bundle for
       8.4 KB of actual data. They live in data/menu.lqip.json, keyed by src, and
       are looked up at render time. */
    return rest;
  }),
}));

const client = { ...source, categories };

// The dataset's shape is asserted at the point it is written, not hoped for.
if (categories.length !== source.categories.length) throw new Error("category count changed");
if (items !== haystacks.length) throw new Error("haystack count does not match item count");
if (JSON.stringify(client).includes('"searchBlob"')) throw new Error("searchBlob leaked into the client dataset");

writeFileSync(p("data/menu.client.json"), JSON.stringify(client) + "\n");
writeFileSync(p("data/menu.search.json"), JSON.stringify({ items: haystacks }) + "\n");

const kb = (o) => (JSON.stringify(o).length / 1024).toFixed(1).padStart(7);
console.log(`
  ✓ data/menu.client.json  ${kb(client)} KB   ${items} items, searchBlob stripped
  ✓ data/menu.search.json  ${kb({ items: haystacks })} KB   loaded only when someone searches
    source was             ${kb(source)} KB
`);
