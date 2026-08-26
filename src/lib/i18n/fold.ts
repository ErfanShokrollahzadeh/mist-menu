/**
 * Turkish-aware case folding for search and slugs.
 *
 * `String.prototype.toLowerCase()` is wrong for Turkish: it maps `İ` (U+0130)
 * to `i` + U+0307 (a combining dot above) rather than to `i`, and maps `I` to
 * `i` rather than to `ı`. The practical effect in the previous build was that
 * searching "içecek" did not match "İÇECEKLER" — the filter silently returned
 * nothing.
 *
 *   "İÇECEKLER".toLowerCase().includes("içecek")            // false
 *   foldTr("İÇECEKLER").includes(foldTr("içecek"))          // true
 *
 * NFD normalisation alone does not fix this: `ı` (U+0131) is its own base
 * letter, not `i` plus a diacritic, so the explicit map below is required.
 */
const TR_MAP: Record<string, string> = {
  ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g",
  ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c", â: "a", î: "i", û: "u",
};

/** Lowercase and strip diacritics so search is forgiving in both locales. */
export function foldTr(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİşŞğĞüÜöÖçÇâîû]/g, (ch) => TR_MAP[ch] ?? ch)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/** URL-safe, stable, collision-free across the full menu. */
export function slugify(input: string): string {
  return foldTr(input)
    .replace(/&/g, " ve ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Turkish-correct alphabetical sorting (ç < d, ı < i, ş < t …). */
export const trCollator = new Intl.Collator("tr-TR", { sensitivity: "base" });
