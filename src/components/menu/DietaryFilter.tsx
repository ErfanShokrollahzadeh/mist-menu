"use client";

import { memo } from "react";
import { motion } from "motion/react";
import type { DietaryTag } from "@/types/menu";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { spring } from "@/lib/motion";
import { TAG_META } from "./DietaryBadges";
import { cn } from "@/lib/cn";

/**
 * The five tags the dataset genuinely carries, in descending frequency:
 * vegetarian (78), vegan (57), caffeine (43), spicy (15), chef's choice (5).
 *
 * There is deliberately no gluten-free chip. `allergenDataAvailable` is false
 * in the source data and no item carries allergen information, so a
 * gluten-free filter would be inventing a food-safety claim on the cafe's
 * behalf. It goes in the moment the kitchen supplies the data, and not before.
 */
export const FILTER_TAGS: DietaryTag[] = [
  "vegetarian",
  "vegan",
  "caffeine",
  "spicy",
  "chefs-choice",
];

function DietaryFilterImpl({
  active,
  onToggle,
  onClear,
}: {
  active: DietaryTag[];
  onToggle: (tag: DietaryTag) => void;
  onClear: () => void;
}) {
  const { t } = useLanguage();
  const none = active.length === 0;

  return (
    <div
      className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 py-1"
      role="group"
      aria-label={t("filters")}
    >
      <button
        type="button"
        onClick={onClear}
        aria-pressed={none}
        className={cn(
          "relative isolate shrink-0 rounded-[var(--radius-pill)] px-3.5 py-1.5",
          "text-[13px] font-medium whitespace-nowrap transition-[color,transform] duration-200 active:scale-95",
          none ? "text-[var(--accent-contrast)]" : "glass text-[var(--ink-muted)] hover:text-[var(--ink)]",
        )}
      >
        {none && (
          <motion.span
            layoutId="mist-filter-chip"
            transition={spring.snappy}
            className="absolute inset-0 -z-10 rounded-[var(--radius-pill)] bg-[var(--accent)]"
          />
        )}
        {t("all")}
      </button>

      {FILTER_TAGS.map((tag) => {
        const meta = TAG_META[tag];
        if (!meta) return null;
        const Icon = meta.icon;
        const on = active.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onToggle(tag)}
            aria-pressed={on}
            className={cn(
              "relative isolate flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] px-3.5 py-1.5",
              "text-[13px] font-medium whitespace-nowrap transition-[color,transform] duration-200 active:scale-95",
              on
                ? "text-[var(--accent-contrast)]"
                : cn("glass hover:text-[var(--ink)]", meta.cls),
            )}
          >
            {on && (
              <motion.span
                layoutId={`mist-filter-${tag}`}
                transition={spring.snappy}
                className="absolute inset-0 -z-10 rounded-[var(--radius-pill)] bg-[var(--accent)]"
              />
            )}
            <Icon className="size-3.5" strokeWidth={2.4} />
            {t(meta.label)}
          </button>
        );
      })}
    </div>
  );
}

/** Stays mounted through every keystroke in search, so it is worth memoizing. */
export const DietaryFilter = memo(DietaryFilterImpl);
