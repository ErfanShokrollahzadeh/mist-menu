import Fuse, { type IFuseOptions } from "fuse.js";
import haystacks from "../../data/menu.search.json";
import { getItem } from "./menu";
import { foldTr } from "./i18n/fold";
import type { MenuItem, Locale } from "@/types/menu";

/**
 * The search engine. Loaded on demand by `./search` — this module is the only
 * thing that pulls in fuse.js and the 38 KB haystack index, so neither reaches
 * a visitor who never types in the box.
 */

type Indexed = { c: string; s: string; haystack: string };

const OPTIONS: IFuseOptions<Indexed> = {
  keys: ["haystack"],
  threshold: 0.34,       // forgiving enough for typos, tight enough to stay relevant
  ignoreLocation: true,
  minMatchCharLength: 2,
};

/**
 * One index per locale, built lazily and cached. The haystacks were folded at
 * codemod time, so a keystroke costs one fold of the query rather than 251 of
 * the data.
 */
const indexes = new Map<Locale, Fuse<Indexed>>();

function indexFor(locale: Locale): Fuse<Indexed> {
  let fuse = indexes.get(locale);
  if (!fuse) {
    fuse = new Fuse(
      haystacks.items.map((h) => ({ c: h.c, s: h.s, haystack: h[locale] })),
      OPTIONS,
    );
    indexes.set(locale, fuse);
  }
  return fuse;
}

export function searchMenu(query: string, locale: Locale, limit = 60): MenuItem[] {
  const q = foldTr(query);
  if (q.length < 2) return [];
  const hits: MenuItem[] = [];
  for (const result of indexFor(locale).search(q, { limit })) {
    // The index carries keys, not items, so the 251 MenuItems are not duplicated
    // into this chunk.
    const item = getItem(result.item.c, result.item.s);
    if (item) hits.push(item);
  }
  return hits;
}
