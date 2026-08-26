"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import type { MenuItem } from "@/types/menu";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatPrice } from "@/lib/menu";
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

export function ItemCard({
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

  return (
    <motion.article
      variants={cascadeItem}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="group glass glass-edge content-auto relative overflow-hidden rounded-[var(--radius-card)]"
      style={{ ["--glow" as string]: glow }}
    >
      {/* The dish's ambient colour, revealed on hover. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
        style={{ background: `radial-gradient(circle at 50% 30%, var(--glow), transparent 65%)` }}
      />

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
            />
          ) : (
            <div className="size-full bg-[var(--hairline)]" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
          <span className="absolute right-2.5 bottom-2.5 rounded-[var(--radius-pill)] bg-black/55 px-2.5 py-1 text-sm font-bold text-white tabular-nums backdrop-blur-sm">
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
