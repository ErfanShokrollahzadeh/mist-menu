"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { UtensilsCrossed, BellRing, ReceiptText, Wifi, MessageSquareHeart, MapPin } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useUi, type SheetName } from "@/stores/ui";
import { HeroCarousel } from "@/components/hero/HeroCarousel";
import { GlassSurface } from "@/components/glass/GlassSurface";
import { cascade, cascadeItem } from "@/lib/motion";
import { categories } from "@/lib/menu";
import type { DictionaryKey } from "@/lib/i18n/types";

type Tile =
  | { kind: "link"; id: string; href: string; icon: typeof Wifi; label: DictionaryKey; hint?: string }
  | { kind: "sheet"; id: string; sheet: NonNullable<SheetName>; icon: typeof Wifi; label: DictionaryKey; hint?: string };

export default function HomePage() {
  const { lang, t } = useLanguage();
  const openSheet = useUi((s) => s.openSheet);

  const itemCount = categories.reduce((n, c) => n + c.items.length, 0);

  const tiles: Tile[] = [
    { kind: "link",  id: "menu",     href: `/${lang}/menu`,    icon: UtensilsCrossed,    label: "menu",        hint: t("itemsCount", { count: itemCount }) },
    { kind: "sheet", id: "waiter",   sheet: "waiter",          icon: BellRing,           label: "callWaiter" },
    { kind: "sheet", id: "bill",     sheet: "bill",            icon: ReceiptText,        label: "bill" },
    { kind: "sheet", id: "wifi",     sheet: "wifi",            icon: Wifi,               label: "wifi" },
    { kind: "sheet", id: "feedback", sheet: "feedback",        icon: MessageSquareHeart, label: "feedback" },
    { kind: "link",  id: "contact",  href: `/${lang}/contact`, icon: MapPin,             label: "contact" },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pt-4 pb-32 sm:px-6">
      <HeroCarousel />

      <motion.ul
        variants={cascade}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {tiles.map((tile) => {
          const Icon = tile.icon;
          const body = (
            <>
              <span className="grid size-11 place-items-center rounded-2xl bg-[var(--accent)]/12 text-[var(--accent)]">
                <Icon className="size-[22px]" strokeWidth={1.9} />
              </span>
              <span className="space-y-0.5">
                <span className="block text-[15px] leading-tight font-semibold">{t(tile.label)}</span>
                {tile.hint && (
                  <span className="block text-xs text-[var(--ink-faint)] tabular-nums">{tile.hint}</span>
                )}
              </span>
            </>
          );
          const cls =
            "flex h-full w-full flex-col items-start gap-3 p-4 text-left transition-transform duration-200 active:scale-[0.97]";

          return (
            <motion.li key={tile.id} variants={cascadeItem}>
              <GlassSurface className="h-full">
                {tile.kind === "link" ? (
                  <Link href={tile.href} className={cls}>{body}</Link>
                ) : (
                  <button type="button" onClick={() => openSheet(tile.sheet)} className={cls}>
                    {body}
                  </button>
                )}
              </GlassSurface>
            </motion.li>
          );
        })}
      </motion.ul>
    </main>
  );
}
