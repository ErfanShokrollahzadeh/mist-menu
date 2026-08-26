"use client";

import { motion } from "motion/react";
import type { MenuCategory } from "@/types/menu";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/cn";

export function CategoryRail({
  categories,
  active,
  onChange,
}: {
  categories: MenuCategory[];
  active: string | null;
  onChange: (slug: string | null) => void;
}) {
  const { lang, t } = useLanguage();
  const pills: { slug: string | null; label: string; icon?: string }[] = [
    { slug: null, label: t("all") },
    ...categories.map((c) => ({ slug: c.slug, label: c.name[lang], icon: c.icon })),
  ];

  return (
    <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
      {pills.map((p) => {
        const selected = p.slug === active;
        return (
          <button
            key={p.slug ?? "__all"}
            onClick={() => onChange(p.slug)}
            aria-pressed={selected}
            className={cn(
              "relative isolate flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] px-3.5 py-2",
              "text-[13px] font-medium whitespace-nowrap transition-colors duration-200",
              selected
                ? "text-[var(--accent-contrast)]"
                : "glass text-[var(--ink-muted)] hover:text-[var(--ink)]",
            )}
          >
            {selected && (
              <motion.span
                layoutId="mist-category-pill"
                transition={spring.snappy}
                className="absolute inset-0 -z-10 rounded-[var(--radius-pill)] bg-[var(--secondary)]"
              />
            )}
            {p.icon && <span aria-hidden className="leading-none">{p.icon}</span>}
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
