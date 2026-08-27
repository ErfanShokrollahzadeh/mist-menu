#!/usr/bin/env node
/**
 * Generates a tiny blurred placeholder (LQIP) for every distinct dish photo.
 *
 * Cards used to pop in from a flat grey box. `next/image` can generate these
 * automatically, but only for statically imported images — ours are string
 * paths that come out of the dataset, so they have to be produced here.
 *
 * There are 251 items but only 40 distinct photos (all 20 desserts share one),
 * so this is 40 encodes, not 251. Output is committed as data/menu.lqip.json;
 * the build reads that and never needs the network.
 *
 * Re-run with `npm run data:lqip` when photos change. Images that cannot be
 * read or fetched are skipped, and the card simply falls back to the old plain
 * background — `ItemCard` only sets `placeholder="blur"` when a URL exists.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...parts) => join(root, ...parts);

const source = JSON.parse(readFileSync(p("data/menu.source.json"), "utf8"));
const srcs = [
  ...new Set(
    source.categories.flatMap((c) => c.items.map((i) => i.image?.src).filter(Boolean)),
  ),
];

/** 12x9 keeps the card's 4:3 box and lands at roughly 200 bytes of base64. */
async function lqip(buffer) {
  const webp = await sharp(buffer).resize(12, 9, { fit: "cover" }).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${webp.toString("base64")}`;
}

const out = {};
let local = 0, remote = 0, skipped = 0;

for (const src of srcs) {
  try {
    if (src.startsWith("http")) {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      out[src] = await lqip(Buffer.from(await res.arrayBuffer()));
      remote++;
    } else {
      const file = p("public", src.replace(/^\//, ""));
      if (!existsSync(file)) throw new Error("not on disk");
      out[src] = await lqip(readFileSync(file));
      local++;
    }
  } catch (error) {
    skipped++;
    console.warn(`  ! skipped ${src} — ${error.message}`);
  }
}

writeFileSync(p("data/menu.lqip.json"), JSON.stringify(out, null, 0) + "\n");

const bytes = JSON.stringify(out).length;
console.log(`
  ✓ data/menu.lqip.json   ${(bytes / 1024).toFixed(1)} KB
    ${local} local · ${remote} remote · ${skipped} skipped   (${srcs.length} distinct photos for ${source.categories.reduce((n, c) => n + c.items.length, 0)} items)
    average ${Math.round(bytes / Math.max(1, local + remote))} bytes per placeholder
`);
