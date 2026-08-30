"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import type { MenuCategory } from "@/types/menu";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * Category navigation, not a filter.
 *
 * This used to filter the grid down to one category, which meant reaching a
 * neighbouring category cost two taps and hid everything either side of it.
 * Now a tap scrolls to the section and scrolling highlights the section you
 * are in, so the whole group stays browsable in one continuous list — which
 * is how a paper menu actually reads.
 */
export function CategoryRail({
  categories,
  active,
  onJump,
}: {
  categories: MenuCategory[];
  active: string | null;
  onJump: (slug: string) => void;
}) {
  const { lang } = useLanguage();
  const railRef = useRef<HTMLDivElement>(null);

  /* Keep the highlighted pill on screen as the reader scrolls the page.
     Done by hand rather than with scrollIntoView, which would also scroll the
     document vertically and fight the very scroll that triggered it. */
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !active) return;
    const pill = rail.querySelector<HTMLElement>(`[data-slug="${CSS.escape(active)}"]`);
    if (!pill) return;

    const target = pill.offsetLeft - rail.clientWidth / 2 + pill.offsetWidth / 2;
    const next = Math.max(0, Math.min(target, rail.scrollWidth - rail.clientWidth));
    if (Math.abs(next - rail.scrollLeft) < 4) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollTo({ left: next, behavior: reduced ? "auto" : "smooth" });
  }, [active]);

  if (!categories.length) return null;

  return (
    <div
      ref={railRef}
      className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 py-1"
      role="tablist"
      aria-label={lang === "tr" ? "Kategoriler" : "Categories"}
    >
      {categories.map((c) => {
        const selected = c.slug === active;
        return (
          <button
            key={c.slug}
            data-slug={c.slug}
            role="tab"
            aria-selected={selected}
            onClick={() => onJump(c.slug)}
            className={cn(
              "relative isolate flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] px-3.5 py-2",
              "text-[13px] font-medium whitespace-nowrap transition-colors duration-200",
              "active:scale-95 transition-transform",
              selected
                ? "text-[var(--chip-active-ink)] font-semibold"
                : "glass text-[var(--ink-muted)] hover:text-[var(--ink)]",
            )}
          >
            {selected && (
              <motion.span
                layoutId="mist-category-pill"
                transition={spring.snappy}
                className="absolute inset-0 -z-10 rounded-[var(--radius-pill)] bg-[var(--chip-active)] ring-1 ring-[var(--chip-active-ink)]/30"
              />
            )}
            <span aria-hidden className="leading-none">{c.icon}</span>
            {c.name[lang]}
          </button>
        );
      })}
    </div>
  );
}
