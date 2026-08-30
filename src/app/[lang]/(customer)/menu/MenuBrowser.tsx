"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { SearchX } from "lucide-react";
import { toast } from "sonner";
import type { MenuItem, DietaryTag } from "@/types/menu";
import { groups, categoriesInGroup, getCategory } from "@/lib/menu";
import { loadSearch, searchMenu } from "@/lib/search";
import { useScrollSpy, useHeaderCollapse, jumpToCategory } from "@/lib/useScrollSpy";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCart } from "@/stores/cart";
import { GroupTabs } from "@/components/menu/GroupTabs";
import { CategoryRail } from "@/components/menu/CategoryRail";
import { DietaryFilter } from "@/components/menu/DietaryFilter";
import { SearchField } from "@/components/menu/SearchField";
import { CategorySection } from "@/components/menu/CategorySection";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** Opened by a tap, never needed for first paint — so it is not in the initial bundle. */
const ItemDetailSheet = dynamic(
  () => import("@/components/menu/ItemDetailSheet").then((m) => m.ItemDetailSheet),
  { ssr: false },
);

/** AND, not OR: chips narrow the menu down, which is what a dietary filter is for. */
const matchesTags = (item: MenuItem, tags: DietaryTag[]) =>
  tags.every((tag) => item.tags.includes(tag));

export function MenuBrowser() {
  const { lang, t } = useLanguage();
  const add = useCart((s) => s.add);

  const [group, setGroup] = useState(groups[0]!.slug);
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<DietaryTag[]>([]);
  const [detail, setDetail] = useState<MenuItem | null>(null);
  const [searchReady, setSearchReady] = useState(false);

  // Keeps typing responsive while the 251-item index is queried.
  const deferredQuery = useDeferredValue(query);
  const searching = deferredQuery.trim().length >= 2;

  /*
   * Selecting a group is two jobs of very different weight: move the pill, and
   * rebuild a grid of up to 82 cards. Deferring the second lets the first
   * commit immediately, so the tab responds to the tap while React builds the
   * new grid at a priority it can interrupt.
   *
   * Note this is `useDeferredValue` rather than wrapping the setter in
   * `startTransition`: a transition would sweep the tab's own selected state in
   * with the grid and hold the pill back until the whole commit landed, which
   * is the opposite of what we want.
   */
  const deferredGroup = useDeferredValue(group);
  const deferredTags = useDeferredValue(tags);

  // Urgent copy: drives the rail, which must track the tab instantly.
  const groupCategories = useMemo(() => categoriesInGroup(group), [group]);
  // Deferred copy: drives the grid.
  const listCategories = useMemo(() => categoriesInGroup(deferredGroup), [deferredGroup]);

  /*
   * fuse.js and the haystack index are a lazy chunk. Warm it once the page has
   * gone idle so the first keystroke is instant, without putting ~60 KB in
   * front of first paint.
   */
  useEffect(() => {
    let cancelled = false;
    const warm = () => {
      void loadSearch().then(() => {
        if (!cancelled) setSearchReady(true);
      });
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(warm, { timeout: 3000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }
    const id = window.setTimeout(warm, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  const sections = useMemo(() => {
    const filter = (items: MenuItem[]) =>
      deferredTags.length ? items.filter((i) => matchesTags(i, deferredTags)) : items;

    if (searching) {
      // Empty until the chunk lands; `searchReady` re-runs this when it does.
      const hits = filter(searchMenu(deferredQuery, lang));
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
    return listCategories
      .map((c) => ({ category: c, items: filter(c.items) }))
      .filter((s) => s.items.length > 0);
  }, [searching, deferredQuery, lang, listCategories, deferredTags, searchReady]);

  const resultCount = sections.reduce((n, s) => n + s.items.length, 0);
  // Distinguishes "the index has not arrived" from "there are genuinely no hits",
  // so a fast typist never sees a false "no results".
  const searchPending = searching && !searchReady;

  /* Scrollspy highlights whichever section the reader is actually looking at.
     Only meaningful while browsing — search results are their own ordering. */
  const spySlugs = useMemo(() => sections.map((s) => s.category.slug), [sections]);
  const { active: spyActive, headerRef } = useScrollSpy(spySlugs, !searching);

  /* Scrolling down folds the search and chips away so the food gets the
     screen; scrolling up brings them straight back. Never while searching —
     hiding the field you are typing into would be absurd. */
  const scrolledDown = useHeaderCollapse();
  const collapsed = scrolledDown && !searching && tags.length === 0;

  /*
   * Both handlers are passed to every one of up to 82 memoized cards, so their
   * identity has to hold across renders or the memo does nothing. `setDetail`
   * is a state setter and already stable.
   */
  const quickAdd = useCallback(
    (item: MenuItem) => {
      add(item, {}, 1);
      toast.success(t("addedToTray", { name: item.name[lang] }));
    },
    [add, t, lang],
  );

  const closeDetail = useCallback(() => setDetail(null), []);

  // Typing is also a signal to fetch the index, in case idle never came.
  const changeQuery = useCallback((value: string) => {
    setQuery(value);
    if (value.length > 0) void loadSearch().then(() => setSearchReady(true));
  }, []);

  const changeGroup = useCallback((slug: string) => {
    setGroup(slug);
    setQuery("");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const toggleTag = useCallback((tag: DietaryTag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));
  }, []);

  const clearTags = useCallback(() => setTags([]), []);

  return (
    <>
      <div
        ref={headerRef}
        data-collapsed={collapsed || undefined}
        className="glass-strong sticky top-16 z-30 -mx-4 space-y-2 rounded-none px-4 py-3 sm:-mx-6 sm:px-6 lg:mx-[calc(50%-50vw)] lg:px-[calc(50vw-50%+1.5rem)]"
      >
        {/* grid-rows 1fr -> 0fr collapses to exactly the content height with a
            single cheap transition, and needs no measurement in JS. */}
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-out-expo)]",
            collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
          )}
          aria-hidden={collapsed}
          // Zero-height but still in the DOM, so without `inert` a keyboard
          // user could tab into a search field they cannot see.
          inert={collapsed}
        >
          <div className="overflow-hidden">
            <div className="space-y-2">
              <SearchField value={query} onChange={changeQuery} />
              <DietaryFilter active={tags} onToggle={toggleTag} onClear={clearTags} />
            </div>
          </div>
        </div>
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
              {searchPending ? " " : t("resultsFor", { query: deferredQuery, count: resultCount })}
            </motion.p>
          ) : (
            <motion.div key="tabs" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <GroupTabs active={group} onChange={changeGroup} />
              <CategoryRail
                categories={groupCategories}
                active={spyActive}
                onJump={jumpToCategory}
              />
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
        ) : searchPending ? null : (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="glass mx-auto max-w-sm rounded-[var(--radius-card)] px-6 py-12 text-center"
          >
            <SearchX className="mx-auto mb-3 size-9 text-[var(--ink-faint)]" strokeWidth={1.6} />
            <h3 className="text-base font-bold">{t("noResults")}</h3>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {searching
                ? t("noResultsQuery", { query: deferredQuery })
                : tags.length
                  ? t("noResultsFilters")
                  : t("noResultsDesc")}
            </p>
          </motion.div>
        )}
      </div>

      {/* Rendered unconditionally (it returns null while closed) so the dynamic
          chunk is fetched just after hydration rather than on the first tap. */}
      <ItemDetailSheet item={detail} onClose={closeDetail} />
    </>
  );
}
