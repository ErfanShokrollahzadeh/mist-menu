"use client";

import type { TopItemDto } from "@/lib/admin/analytics";
import { SERIES } from "@/lib/admin/palette";
import { useTheme } from "@/components/system/ThemeProvider";
import { formatPrice } from "@/lib/menu";

/**
 * Ranked magnitude: one hue for every bar. Colour would encode nothing here —
 * rank is already carried by order and length — and tinting by rank would
 * repaint the survivors whenever the range filter changes.
 */
export function TopItemsBar({ items }: { items: TopItemDto[] }) {
  const { resolved } = useTheme();
  const fill = SERIES[resolved];
  const max = Math.max(...items.map((i) => i.quantitySold), 1);

  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-[var(--ink-muted)]">Bu aralıkta satış yok.</p>;
  }

  return (
    <ol className="space-y-2">
      {items.map((item) => (
        <li key={`${item.categorySlug}/${item.slug}`} className="group">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.nameTr}</span>
            {/* Direct label on every bar: ten rows, and the number is the point. */}
            <span className="shrink-0 text-sm font-bold tabular-nums">{item.quantitySold}</span>
            <span className="w-24 shrink-0 text-right text-xs text-[var(--ink-muted)] tabular-nums">
              {formatPrice(item.revenueMinor, "tr")}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--hairline)]">
            <div
              // 4px rounded data-end, anchored to the baseline.
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${(item.quantitySold / max) * 100}%`, background: fill }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
