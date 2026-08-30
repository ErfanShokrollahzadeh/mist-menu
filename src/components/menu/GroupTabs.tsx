"use client";

import { motion } from "motion/react";
import { groups } from "@/lib/menu";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/cn";

export function GroupTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (slug: string) => void;
}) {
  const { lang } = useLanguage();

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 py-1"
    >
      {groups.map((g) => {
        const selected = g.slug === active;
        return (
          <button
            key={g.slug}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(g.slug)}
            className={cn(
              "relative isolate flex shrink-0 items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2.5",
              "text-sm font-semibold whitespace-nowrap",
              "transition-[color,transform] duration-200 active:scale-95",
              selected ? "text-[var(--accent-contrast)]" : "glass text-[var(--ink-muted)] hover:text-[var(--ink)]",
            )}
          >
            {selected && (
              <motion.span
                layoutId="mist-group-tab"
                transition={spring.snappy}
                className="absolute inset-0 -z-10 rounded-[var(--radius-pill)] bg-[var(--accent)]"
              />
            )}
            <span aria-hidden className="text-base leading-none">{g.icon}</span>
            {g.name[lang]}
          </button>
        );
      })}
    </div>
  );
}
