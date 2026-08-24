import Fuse, { type IFuseOptions } from "fuse.js";
import { allItems } from "./menu";
import { foldTr } from "./i18n/fold";
import type { MenuItem, Locale } from "@/types/menu";

type Indexed = { item: MenuItem; haystack: string };

const OPTIONS: IFuseOptions<Indexed> = {
  keys: ["haystack"],
  threshold: 0.34,       // forgiving enough for typos, tight enough to stay relevant
  ignoreLocation: true,
  minMatchCharLength: 2,
};

/**
 * One index per locale, built lazily. The haystacks were folded at codemod
 * time, so a keystroke costs one fold of the query rather than 251 of the data.
 */
const indexes = new Map<Locale, Fuse<Indexed>>();

function indexFor(locale: Locale): Fuse<Indexed> {
  let fuse = indexes.get(locale);
  if (!fuse) {
    fuse = new Fuse(
      allItems.map((item) => ({ item, haystack: item.searchBlob[locale] })),
      OPTIONS,
    );
    indexes.set(locale, fuse);
  }
  return fuse;
}

export function searchMenu(query: string, locale: Locale, limit = 60): MenuItem[] {
  const q = foldTr(query);
  if (q.length < 2) return [];
  return indexFor(locale)
    .search(q, { limit })
    .map((r) => r.item.item);
}
