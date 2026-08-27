"use client";

import { memo } from "react";
import { motion } from "motion/react";
import type { MenuCategory, MenuItem } from "@/types/menu";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cascade } from "@/lib/motion";
import { ItemCard } from "./ItemCard";

function CategorySectionImpl({
  category,
  items,
  onOpen,
  onQuickAdd,
  eager = false,
}: {
  category: MenuCategory;
  items: MenuItem[];
  onOpen: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
  eager?: boolean;
}) {
  const { lang, t } = useLanguage();
  if (!items.length) return null;

  return (
    <section id={`cat-${category.slug}`} className="scroll-mt-32">
      <header className="mb-3 flex items-baseline gap-2.5">
        {/* Icon comes from the data now, not a Turkish-keyed lookup that
            fell back to a generic glyph for every English category name. */}
        <span aria-hidden className="text-xl leading-none">{category.icon}</span>
        <h2 className="text-lg font-bold tracking-tight">{category.name[lang]}</h2>
        <span className="text-xs font-medium text-[var(--ink-faint)] tabular-nums">
          {t("itemsCount", { count: items.length })}
        </span>
      </header>

      <motion.div
        variants={cascade}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        {items.map((item, i) => (
          <ItemCard
            key={item.slug}
            item={item}
            onOpen={onOpen}
            onQuickAdd={onQuickAdd}
            priority={eager && i < 4}
          />
        ))}
      </motion.div>
    </section>
  );
}

/**
 * Memoized because a group tab mounts up to 11 of these at once and a keystroke
 * in search would otherwise re-render every section and all of their cards.
 * The `items` arrays come straight off the static dataset, so their identity is
 * stable between renders; MenuBrowser keeps `onOpen`/`onQuickAdd` stable too.
 */
export const CategorySection = memo(CategorySectionImpl);
