"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SearchX } from "lucide-react";
import { toast } from "sonner";
import type { MenuItem } from "@/types/menu";
import { groups, categories, categoriesInGroup, getCategory } from "@/lib/menu";
import { searchMenu } from "@/lib/search";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCart } from "@/stores/cart";
import { GroupTabs } from "@/components/menu/GroupTabs";
import { CategoryRail } from "@/components/menu/CategoryRail";
import { SearchField } from "@/components/menu/SearchField";
import { CategorySection } from "@/components/menu/CategorySection";
import { ItemDetailSheet } from "@/components/menu/ItemDetailSheet";
import { fadeUp } from "@/lib/motion";

export function MenuBrowser() {
  const { lang, t } = useLanguage();
  const add = useCart((s) => s.add);

  const [group, setGroup] = useState(groups[0]!.slug);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<MenuItem | null>(null);

  // Keeps typing responsive while the 251-item index is queried.
  const deferredQuery = useDeferredValue(query);
  const searching = deferredQuery.trim().length >= 2;

  const groupCategories = useMemo(() => categoriesInGroup(group), [group]);

  const sections = useMemo(() => {
    if (searching) {
      const hits = searchMenu(deferredQuery, lang);
      const byCategory = new Map<string, MenuItem[]>();
      for (const item of hits) {
        const list = byCategory.get(item.categorySlug) ?? [];
        list.push(item);
        byCategory.set(item.categorySlug, list);
      }
      return [...byCategory.entries()]
        .map(([slug, items]) => ({ category: getCategory(slug)!, items }))
        .filter((s) => s.category);
    }
    return groupCategories
      .filter((c) => !category || c.slug === category)
      .map((c) => ({ category: c, items: c.items }));
  }, [searching, deferredQuery, lang, groupCategories, category]);

  const resultCount = sections.reduce((n, s) => n + s.items.length, 0);

  const quickAdd = (item: MenuItem) => {
    add(item, {}, 1);
    toast.success(t("addedToTray", { name: item.name[lang] }));
  };

  const changeGroup = (slug: string) => {
    setGroup(slug);
    setCategory(null);
    setQuery("");
  };

  return (
    <>
      <div className="glass-strong sticky top-16 z-30 -mx-4 space-y-2 px-4 py-3 sm:-mx-6 sm:px-6">
        <SearchField value={query} onChange={setQuery} />
        <AnimatePresence mode="wait" initial={false}>
          {searching ? (
            <motion.p
              key="count"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className="px-1 text-xs font-medium text-[var(--ink-muted)]"
            >
              {t("resultsFor", { query: deferredQuery, count: resultCount })}
            </motion.p>
          ) : (
            <motion.div key="tabs" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <GroupTabs active={group} onChange={changeGroup} />
              <CategoryRail categories={groupCategories} active={category} onChange={setCategory} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-9 py-6">
        {sections.length > 0 ? (
          sections.map((s, i) => (
            <CategorySection
              key={s.category.slug}
              category={s.category}
              items={s.items}
              onOpen={setDetail}
              onQuickAdd={quickAdd}
              eager={i === 0}
            />
          ))
        ) : (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="glass mx-auto max-w-sm rounded-[var(--radius-card)] px-6 py-12 text-center"
          >
            <SearchX className="mx-auto mb-3 size-9 text-[var(--ink-faint)]" strokeWidth={1.6} />
            <h3 className="text-base font-bold">{t("noResults")}</h3>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {searching ? t("noResultsQuery", { query: deferredQuery }) : t("noResultsDesc")}
            </p>
          </motion.div>
        )}
      </div>

      <ItemDetailSheet item={detail} onClose={() => setDetail(null)} />
    </>
  );
}
