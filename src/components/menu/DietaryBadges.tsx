import { Leaf, Flame, Sprout, ChefHat, Coffee } from "lucide-react";
import type { DietaryTag } from "@/types/menu";
import type { DictionaryKey } from "@/lib/i18n/types";
import { cn } from "@/lib/cn";

/** Shared with DietaryFilter so the chip and the badge cannot drift apart. */
export const TAG_META: Partial<Record<DietaryTag, { icon: typeof Leaf; label: DictionaryKey; cls: string }>> = {
  vegan:          { icon: Sprout,  label: "tagVegan",       cls: "text-emerald-600 dark:text-emerald-400" },
  vegetarian:     { icon: Leaf,    label: "tagVegetarian",  cls: "text-lime-600 dark:text-lime-400" },
  spicy:          { icon: Flame,   label: "tagSpicy",       cls: "text-orange-600 dark:text-orange-400" },
  "chefs-choice": { icon: ChefHat, label: "tagChefsChoice", cls: "text-[var(--accent-ink)]" },
  caffeine:       { icon: Coffee,  label: "tagCaffeine",    cls: "text-amber-700 dark:text-amber-500" },
};

export function DietaryBadges({
  tags, t, compact = false, className,
}: {
  tags: DietaryTag[];
  t: (key: DictionaryKey) => string;
  compact?: boolean;
  className?: string;
}) {
  const shown = tags.map((tag) => [tag, TAG_META[tag]] as const).filter(([, m]) => m);
  if (!shown.length) return null;

  return (
    <ul className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {shown.map(([tag, meta]) => {
        const Icon = meta!.icon;
        return (
          <li
            key={tag}
            className={cn(
              "glass-flat inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-semibold",
              meta!.cls,
            )}
            title={t(meta!.label)}
          >
            <Icon className="size-3" strokeWidth={2.4} />
            {!compact && <span>{t(meta!.label)}</span>}
          </li>
        );
      })}
    </ul>
  );
}
