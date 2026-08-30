"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Clock } from "lucide-react";
import type { Order } from "@/lib/api/contracts";
import { formatPrice } from "@/lib/menu";
import { cn } from "@/lib/cn";

/** Minutes since the order was placed — the number that matters on a KDS. */
function useAge(placedAt: string) {
  const minutes = Math.floor((Date.now() - new Date(placedAt).getTime()) / 60000);
  return { minutes, stale: minutes >= 15, warm: minutes >= 8 };
}

export function OrderCard({ order }: { order: Order }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: order.id });
  const { minutes, stale, warm } = useAge(order.placedAt);

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      className={cn(
        "glass glass-edge cursor-grab touch-none rounded-[var(--radius-card)] p-3 active:cursor-grabbing",
        isDragging && "z-50 opacity-90 shadow-2xl",
        // Age is the KDS's primary signal, so it colours the whole card.
        stale && "ring-2 ring-red-500/60",
        !stale && warm && "ring-1 ring-amber-500/50",
      )}
    >
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <span className="font-mono text-sm font-bold">#{order.orderNumber}</span>
        <span className="glass rounded-[var(--radius-pill)] px-2 py-0.5 text-xs font-bold tabular-nums">
          Masa {order.tableId}
        </span>
      </header>

      <ul className="space-y-1">
        {order.lines.map((line, i) => (
          <li key={i} className="flex gap-2 text-sm leading-snug">
            <span className="font-bold tabular-nums text-[var(--accent-ink)]">{line.quantity}×</span>
            <span className="min-w-0 flex-1">
              {line.name.tr}
              {line.selectedOptions.length > 0 && (
                <span className="block text-xs text-[var(--ink-muted)]">
                  {line.selectedOptions.map((o) => o.tr).join(" · ")}
                </span>
              )}
              {line.note && (
                <span className="block text-xs font-medium text-amber-600 dark:text-amber-400">
                  {line.note}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <footer className="mt-2.5 flex items-center justify-between border-t border-[var(--hairline)] pt-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-semibold tabular-nums",
            stale ? "text-red-500" : warm ? "text-amber-500" : "text-[var(--ink-faint)]",
          )}
        >
          <Clock className="size-3.5" />
          {minutes}dk
        </span>
        <span className="text-xs font-bold tabular-nums">
          {formatPrice(order.totalMinor, "tr")}
        </span>
      </footer>
    </article>
  );
}
