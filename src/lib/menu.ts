import menuSource from "../../data/menu.source.json";
import type { MenuDocument, MenuCategory, MenuItem, MenuGroup, Locale } from "@/types/menu";

/** The canonical menu. Same file the .NET seeder reads, so the two cannot drift. */
export const menu = menuSource as unknown as MenuDocument;

export const groups: MenuGroup[] = menu.groups;
export const categories: MenuCategory[] = menu.categories;

export const allItems: MenuItem[] = categories.flatMap((c) => c.items);

const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
const itemBySlug = new Map(allItems.map((i) => [`${i.categorySlug}/${i.slug}`, i]));

export const getCategory = (slug: string) => categoryBySlug.get(slug);
export const getItem = (categorySlug: string, slug: string) =>
  itemBySlug.get(`${categorySlug}/${slug}`);

export const categoriesInGroup = (groupSlug: string) =>
  categories.filter((c) => c.groupSlug === groupSlug);

/** Localized accessor — every display string in the dataset is a {tr,en} pair. */
export const L = (value: Record<Locale, string>, locale: Locale) => value[locale];

/** Kuruş → a correctly formatted price in the reader's locale. */
export function formatPrice(priceMinor: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency: menu.currency,
    minimumFractionDigits: priceMinor % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(priceMinor / 100);
}

/** Total for a line, including any selected modifier deltas. */
export const lineTotalMinor = (unitMinor: number, deltas: number[], qty: number) =>
  (unitMinor + deltas.reduce((a, b) => a + b, 0)) * qty;
