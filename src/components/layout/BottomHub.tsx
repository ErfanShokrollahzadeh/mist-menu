"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { UtensilsCrossed, ShoppingBag, BellRing, ReceiptText, Wifi } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCart, selectCount } from "@/stores/cart";
import { useUi } from "@/stores/ui";
import { useScrolledDown } from "@/lib/useScrolledDown";
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

/** The bar rises once, then its slots arrive in sequence behind it. */
const bar = {
  hidden: { y: 96, opacity: 0, scale: 0.94 },
  show: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { ...spring.soft, delay: 0.12, staggerChildren: 0.045, delayChildren: 0.24 },
  },
};

const slotIn = {
  hidden: { y: 14, opacity: 0, scale: 0.7 },
  show: { y: 0, opacity: 1, scale: 1, transition: spring.snappy },
};

/**
 * The primary navigation: one route, four sheets.
 *
 * It condenses rather than hides. The obvious iOS move is to slide the bar off
 * screen while the reader scrolls down, but this is an ordering surface and the
 * tray lives here — putting the cart behind "scroll back up" taxes the one
 * action the page exists for. So scrolling down folds the labels away and pulls
 * the capsule in to a tight row of icons, and scrolling up lets it breathe
 * again. Everything stays one tap away the whole time.
 *
 * Motion here is affordable in a way it is not on the menu grid: five slots,
 * not eighty-two cards, so gesture props and springs cost nothing measurable.
 */
export function BottomHub() {
  const { lang, t } = useLanguage();
  const pathname = usePathname();
  const count = useCart(selectCount);
  const { sheet, openSheet } = useUi();
  const compact = useScrolledDown();
  const reduced = useReducedMotion();

  const activeId = sheet ?? (pathname.includes("/menu") ? "menu" : null);

  return (
    <motion.nav
      variants={bar}
      initial="hidden"
      animate="show"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      aria-label={t("menu")}
    >
      <div
        className={cn(
          "glass-float relative flex w-full items-stretch gap-1 rounded-[var(--radius-pill)] p-1.5",
          // The capsule itself is the animation: it pulls in around the icons
          // as the labels leave, so the two motions read as one gesture.
          "transition-[max-width] duration-500 ease-[var(--ease-out-expo)]",
          compact ? "max-w-[19rem]" : "max-w-md",
        )}
      >
        {/* Specular sweep: a light streak crosses the glass each time the
            selection moves, the way a highlight travels over a real curved
            surface as it turns. Clipped to its own layer so it cannot crop the
            tray badge that sits proud of the capsule edge. */}
        {!reduced && (
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <AnimatePresence initial={false}>
              <motion.span
                key={activeId ?? "none"}
                initial={{ x: "-140%", opacity: 0 }}
                animate={{ x: "140%", opacity: [0, 1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-[var(--glass-float-rim)] to-transparent"
              />
            </AnimatePresence>
          </span>
        )}

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
                <motion.span
                  className="block"
                  animate={active ? { scale: 1.14, y: -1 } : { scale: 1, y: 0 }}
                  transition={spring.snappy}
                >
                  <Icon className="size-[21px]" strokeWidth={active ? 2.4 : 1.9} />
                </motion.span>

                {/* Keyed on the value, so every increment re-runs the pop rather
                    than silently swapping the digit. */}
                <AnimatePresence mode="popLayout" initial={false}>
                  {badge !== null && (
                    <motion.span
                      key={badge}
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.3, opacity: 0 }}
                      transition={spring.snappy}
                      aria-hidden
                      className="absolute -top-1.5 -right-2 grid min-w-[17px] place-items-center rounded-full bg-[var(--secondary)] px-1 text-[10px] font-bold text-[var(--secondary-contrast)] tabular-nums"
                    >
                      {badge > 9 ? "9+" : badge}
                      {/* A ring pushes out from the badge on each change, so an
                          item landing in the tray is felt and not just counted. */}
                      {!reduced && (
                        <motion.span
                          key={`ring-${badge}`}
                          initial={{ scale: 1, opacity: 0.7 }}
                          animate={{ scale: 2.4, opacity: 0 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="absolute inset-0 rounded-full ring-2 ring-[var(--secondary)]"
                        />
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>

              {/* 1fr -> 0fr folds the label to exactly its own height with one
                  cheap transition and no measurement in JS. */}
              <span
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-400 ease-[var(--ease-out-expo)]",
                  compact ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
                )}
              >
                <span className="overflow-hidden">
                  <span className="block pt-1 text-[10px] leading-none font-semibold tracking-tight">
                    {t(slot.label)}
                  </span>
                </span>
              </span>
            </>
          );

          const className = cn(
            "relative isolate flex size-full flex-col items-center justify-center rounded-[var(--radius-pill)] py-2",
            "transition-colors duration-200",
            // Full-strength ink, not the body-copy grey. This is chrome sitting on
            // a translucent material over arbitrary food photography: measured
            // over a bright dish, --ink-muted fell to 2.87:1. The active state is
            // already carried by the gold pill, so inactive labels do not also
            // need to be faint to read as unselected.
            active ? "text-[var(--accent-contrast)]" : "text-[var(--ink)]",
          );

          return (
            <motion.div
              key={slot.id}
              variants={slotIn}
              whileTap={{ scale: 0.88 }}
              transition={spring.snappy}
              className="flex-1"
            >
              {slot.kind === "link" ? (
                <Link
                  href={`/${lang}${slot.href}`}
                  className={className}
                  aria-label={t(slot.label)}
                  aria-current={active ? "page" : undefined}
                >
                  {inner}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openSheet(slot.sheet)}
                  className={className}
                  aria-label={
                    badge !== null
                      ? `${t(slot.label)} (${badge})` // count spoken deliberately, not as a stray digit
                      : t(slot.label)
                  }
                  aria-haspopup="dialog"
                  aria-expanded={active}
                >
                  {inner}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.nav>
  );
}
