"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { UtensilsCrossed, ShoppingBag, BellRing, ReceiptText, Wifi } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCart, selectCount } from "@/stores/cart";
import { useUi } from "@/stores/ui";
import { spring, NAV_INDICATOR } from "@/lib/motion";
import { cn } from "@/lib/cn";
import type { DictionaryKey } from "@/lib/i18n/types";
import type { SheetName } from "@/stores/ui";

type Slot =
  | { kind: "link"; id: string; href: string; icon: typeof Wifi; label: DictionaryKey }
  | { kind: "sheet"; id: string; sheet: NonNullable<SheetName>; icon: typeof Wifi; label: DictionaryKey };

const SLOTS: Slot[] = [
  { kind: "link",  id: "menu",   href: "/menu", icon: UtensilsCrossed, label: "menu" },
  { kind: "sheet", id: "tray",   sheet: "tray",   icon: ShoppingBag, label: "tray" },
  { kind: "sheet", id: "waiter", sheet: "waiter", icon: BellRing,    label: "callWaiter" },
  { kind: "sheet", id: "bill",   sheet: "bill",   icon: ReceiptText, label: "bill" },
  { kind: "sheet", id: "wifi",   sheet: "wifi",   icon: Wifi,        label: "wifi" },
];

/**
 * The primary navigation. Five slots: one route, four sheets. The active
 * indicator is a single shared-layout element, so it physically travels
 * between slots rather than cross-fading.
 */
export function BottomHub() {
  const { lang, t } = useLanguage();
  const pathname = usePathname();
  const count = useCart(selectCount);
  const { sheet, openSheet } = useUi();

  const activeId = sheet ?? (pathname.includes("/menu") ? "menu" : null);

  return (
    <motion.nav
      initial={{ y: 96, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...spring.soft, delay: 0.15 }}
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      aria-label={t("menu")}
    >
      <div className="glass-strong glass-edge flex w-full max-w-md items-stretch gap-1 rounded-[var(--radius-pill)] p-1.5">
        {SLOTS.map((slot) => {
          const Icon = slot.icon;
          const active = activeId === slot.id;
          const badge = slot.id === "tray" && count > 0 ? count : null;

          const inner = (
            <>
              {active && (
                <motion.span
                  layoutId={NAV_INDICATOR}
                  transition={spring.snappy}
                  className="absolute inset-0 -z-10 rounded-[var(--radius-pill)] bg-[var(--accent)]"
                />
              )}
              <span className="relative">
                <Icon
                  className={cn(
                    "size-[21px] transition-transform duration-200",
                    active && "scale-105",
                  )}
                  strokeWidth={active ? 2.4 : 1.9}
                />
                <AnimatePresence>
                  {badge !== null && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={spring.snappy}
                      aria-hidden
                      className="absolute -top-1.5 -right-2 grid min-w-[17px] place-items-center rounded-full bg-[var(--secondary)] px-1 text-[10px] font-bold text-white tabular-nums"
                    >
                      {badge > 9 ? "9+" : badge}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span className="text-[10px] leading-none font-semibold tracking-tight">
                {t(slot.label)}
              </span>
            </>
          );

          const className = cn(
            "relative isolate flex flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-pill)] py-2 transition-colors duration-200",
            active ? "text-[var(--accent-contrast)]" : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
          );

          return slot.kind === "link" ? (
            <Link
              key={slot.id}
              href={`/${lang}${slot.href}`}
              className={className}
              aria-label={t(slot.label)}
              aria-current={active ? "page" : undefined}
            >
              {inner}
            </Link>
          ) : (
            <button
              key={slot.id}
              type="button"
              onClick={() => openSheet(slot.sheet)}
              className={className}
              aria-label={
                badge !== null
                  ? `${t(slot.label)} (${badge})`   // count spoken deliberately, not as a stray digit
                  : t(slot.label)
              }
              aria-haspopup="dialog"
              aria-expanded={active}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
