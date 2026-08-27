"use client";

import { memo } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import type { MenuItem } from "@/types/menu";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { blurFor, formatPrice } from "@/lib/menu";
import { cascadeItem } from "@/lib/motion";
import { DietaryBadges } from "./DietaryBadges";
import { cn } from "@/lib/cn";

/**
 * Ambient shadow hue, keyed off the category so a dish glows in a colour that
 * belongs to it. Cheap and deterministic — sampling the real image would mean
 * decoding 251 photos on the client.
 */
const CATEGORY_GLOW: Record<string, string> = {
  kahvalti: "var(--color-gold-400)", omlet: "var(--color-gold-400)",
  menemen: "var(--color-ember-500)", gozleme: "var(--color-gold-500)",
  tost: "var(--color-gold-500)", bowl: "var(--color-herb-500)",
  salatalar: "var(--color-herb-500)", vegan: "var(--color-herb-500)",
  sandvic: "var(--color-gold-500)", "wrap-ve-quesedilla": "var(--color-ember-500)",
  aperatifler: "var(--color-gold-400)", burgerler: "var(--color-ember-500)",
  "makarna-ve-noodes": "var(--color-gold-400)", pizzalar: "var(--color-ember-500)",
  "beyaz-etler": "var(--color-gold-500)", "kirmizi-etler": "var(--color-cocoa-500)",
  tatlilar: "var(--color-berry-500)", cay: "var(--color-ember-500)",
  "soft-icecekler": "var(--color-azure-400)", "espresso-bazli-kahveler": "var(--color-cocoa-500)",
  "filtre-kahveler": "var(--color-cocoa-500)", "turk-kahveleri": "var(--color-cocoa-500)",
  "redbull-kokteylleri": "var(--color-berry-500)", "sicak-icecekler": "var(--color-gold-400)",
  "soguk-kahveler": "var(--color-cocoa-500)", "ev-yapimi-sikmalar": "var(--color-ember-500)",
  milkshake: "var(--color-berry-500)", frozen: "var(--color-azure-400)",
  "smoothie-cesitleri": "var(--color-berry-500)", "mist-ozel-kokteyller": "var(--color-berry-500)",
  nargileler: "var(--color-azure-400)",
};

/**
 * A single dish. Up to 82 of these mount in one commit when a group tab is
 * tapped, so everything here is costed per-card and multiplied by 82:
 *
 * - The card keeps its `glass`. What it no longer carries is a nested
 *   `backdrop-blur` on the price pill, `glass` on each dietary badge, or the
 *   64px-blur hover glow — the glow was `opacity-0` behind a `group-hover`, so
 *   on a phone, where this menu is actually read, it rendered a blur for an
 *   effect no touch device can ever trigger.
 * - The hover lift moved out too. Motion owns this element's inline `transform`
 *   for the entrance cascade, so a CSS `hover:` translate could never win
 *   against it; the image's own `group-hover` zoom already carries the
 *   affordance on pointer devices and costs nothing on phones.
 * - `memo` is load-bearing: without it every keystroke in search re-rendered
 *   all 82 cards, because `useDeferredValue` defers the *query*, not the tree.
 *   It only holds while `onOpen`/`onQuickAdd` stay referentially stable, which
 *   is why MenuBrowser wraps both in `useCallback`.
 */
function ItemCardImpl({
  item,
  onOpen,
  onQuickAdd,
  priority = false,
}: {
  item: MenuItem;
  onOpen: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
  priority?: boolean;
}) {
  const { lang, t } = useLanguage();
  const glow = CATEGORY_GLOW[item.categorySlug] ?? "var(--color-gold-400)";
  const hasChoices = item.modifierGroups.length > 0;
  const blur = item.image.src ? blurFor(item.image.src) : undefined;

  return (
    <motion.article
      variants={cascadeItem}
      className="group glass glass-edge content-auto relative overflow-hidden rounded-[var(--radius-card)]"
      style={{ ["--glow" as string]: glow }}
    >
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="block w-full text-left"
        aria-label={item.name[lang]}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {item.image.src ? (
            <Image
              src={item.image.src}
              alt={item.image.alt[lang]}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
              className="object-cover transition-transform duration-[600ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.07]"
              priority={priority}
              {...(priority ? { fetchPriority: "high" as const } : {})}
              {...(blur ? { placeholder: "blur" as const, blurDataURL: blur } : {})}
            />
          ) : (
            <div className="size-full bg-[var(--hairline)]" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
          <span className="absolute right-2.5 bottom-2.5 rounded-[var(--radius-pill)] bg-black/60 px-2.5 py-1 text-sm font-bold text-white tabular-nums">
            {formatPrice(item.priceMinor, lang)}
          </span>
          <DietaryBadges tags={item.tags} t={t} compact className="absolute top-2.5 left-2.5" />
        </div>

        <div className="space-y-1 p-3 pb-2">
          <h3 className="line-clamp-2 text-sm leading-snug font-semibold">{item.name[lang]}</h3>
          {item.description[lang] && (
            <p className="line-clamp-2 text-xs leading-relaxed text-[var(--ink-muted)]">
              {item.description[lang]}
            </p>
          )}
        </div>
      </button>

      <div className="flex items-center justify-between gap-2 px-3 pb-3">
        {hasChoices ? (
          <span className="text-[11px] font-medium text-[var(--ink-faint)]">{t("chooseOne")}</span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => (hasChoices ? onOpen(item) : onQuickAdd(item))}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]",
            "transition-transform duration-200 active:scale-90",
            "shadow-[0_4px_16px_-4px_var(--glow)]",
          )}
          aria-label={`${t("addToTray")}: ${item.name[lang]}`}
        >
          <Plus className="size-[18px]" strokeWidth={2.6} />
        </button>
      </div>
    </motion.article>
  );
}

export const ItemCard = memo(ItemCardImpl);
