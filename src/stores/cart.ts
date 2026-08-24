"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MenuItem } from "@/types/menu";

export interface CartLine {
  /** Stable identity: same item + same modifier choices collapses into one line. */
  id: string;
  categorySlug: string;
  itemSlug: string;
  name: { tr: string; en: string };
  unitPriceMinor: number;
  quantity: number;
  /** groupSlug -> option slugs chosen. */
  selections: Record<string, string[]>;
  selectionLabels: { tr: string; en: string }[];
  modifierDeltaMinor: number;
  note?: string;
  image: string;
}

interface CartState {
  lines: CartLine[];
  add: (item: MenuItem, selections: Record<string, string[]>, quantity?: number, note?: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  setNote: (id: string, note: string) => void;
  clear: () => void;
}

const lineId = (item: MenuItem, selections: Record<string, string[]>) => {
  const sig = Object.keys(selections)
    .sort()
    .map((k) => `${k}:${[...(selections[k] ?? [])].sort().join("+")}`)
    .join("|");
  return `${item.categorySlug}/${item.slug}${sig ? `#${sig}` : ""}`;
};

function resolveSelections(item: MenuItem, selections: Record<string, string[]>) {
  let deltaMinor = 0;
  const labels: { tr: string; en: string }[] = [];
  for (const group of item.modifierGroups) {
    for (const slug of selections[group.slug] ?? []) {
      const opt = group.options.find((o) => o.slug === slug);
      if (!opt) continue;
      deltaMinor += opt.priceDeltaMinor;
      labels.push(opt.name);
    }
  }
  return { deltaMinor, labels };
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],

      add: (item, selections, quantity = 1, note) =>
        set((state) => {
          const id = lineId(item, selections);
          const existing = state.lines.find((l) => l.id === id);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.id === id ? { ...l, quantity: l.quantity + quantity } : l,
              ),
            };
          }
          const { deltaMinor, labels } = resolveSelections(item, selections);
          const line: CartLine = {
            id,
            categorySlug: item.categorySlug,
            itemSlug: item.slug,
            name: item.name,
            unitPriceMinor: item.priceMinor,
            quantity,
            selections,
            selectionLabels: labels,
            modifierDeltaMinor: deltaMinor,
            note,
            image: item.image.src,
          };
          return { lines: [...state.lines, line] };
        }),

      setQuantity: (id, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.id !== id)
              : state.lines.map((l) => (l.id === id ? { ...l, quantity } : l)),
        })),

      remove: (id) => set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),
      setNote: (id, note) =>
        set((state) => ({ lines: state.lines.map((l) => (l.id === id ? { ...l, note } : l)) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "mist.cart.v1", version: 1 },
  ),
);

/* Selectors — subscribing to these avoids re-rendering the whole 251-item grid. */
export const selectCount = (s: CartState) => s.lines.reduce((n, l) => n + l.quantity, 0);
export const selectSubtotalMinor = (s: CartState) =>
  s.lines.reduce((n, l) => n + (l.unitPriceMinor + l.modifierDeltaMinor) * l.quantity, 0);
