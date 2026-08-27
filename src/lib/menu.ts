import menuSource from "../../data/menu.client.json";
import lqip from "../../data/menu.lqip.json";
import type { MenuDocument, MenuCategory, MenuItem, MenuGroup, Locale } from "@/types/menu";

/**
 * The menu, minus the search haystacks. Generated from `data/menu.source.json`
 * — the same file the .NET seeder reads — by scripts/build-client-menu.mjs, so
 * the two cannot drift.
 */
export const menu = menuSource as unknown as MenuDocument;

export const groups: MenuGroup[] = menu.groups;
export const categories: MenuCategory[] = menu.categories;

export const allItems: MenuItem[] = categories.flatMap((c) => c.items);

const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
const itemBySlug = new Map(allItems.map((i) => [`${i.categorySlug}/${i.slug}`, i]));

export const getCategory = (slug: string) => categoryBySlug.get(slug);
export const getItem = (categorySlug: string, slug: string) =>
  itemBySlug.get(`${categorySlug}/${slug}`);

/**
 * Tiny blurred placeholder for a dish photo, so cards resolve from a blur
 * rather than popping out of a flat grey box.
 *
 * Looked up by src rather than stored on each item: 251 items share only 40
 * photos, so inlining these into the dataset cost 53.7 KB instead of 8.4 KB.
 */
export const blurFor = (src: string): string | undefined =>
  (lqip as Record<string, string>)[src];

export const categoriesInGroup = (groupSlug: string) =>
  categories.filter((c) => c.groupSlug === groupSlug);

/** Localized accessor — every display string in the dataset is a {tr,en} pair. */
export const L = (value: Record<Locale, string>, locale: Locale) => value[locale];

/**
 * `Intl.NumberFormat` construction is genuinely expensive, and this runs once
 * per card per render — 82 times on the cold-drinks tab, and again on every
 * keystroke in search. There are only four distinct shapes (two locales x
 * whole/fractional lira), so build each once and keep it.
 */
const priceFormatters = new Map<string, Intl.NumberFormat>();

function priceFormatter(locale: Locale, whole: boolean): Intl.NumberFormat {
  const key = `${locale}:${whole}`;
  let formatter = priceFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
      style: "currency",
      currency: menu.currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    });
    priceFormatters.set(key, formatter);
  }
  return formatter;
}

/** Kuruş → a correctly formatted price in the reader's locale. */
export function formatPrice(priceMinor: number, locale: Locale): string {
  return priceFormatter(locale, priceMinor % 100 === 0).format(priceMinor / 100);
}

/** Total for a line, including any selected modifier deltas. */
export const lineTotalMinor = (unitMinor: number, deltas: number[], qty: number) =>
  (unitMinor + deltas.reduce((a, b) => a + b, 0)) * qty;
