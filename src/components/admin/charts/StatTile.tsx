import type { ReactNode } from "react";
import { GlassSurface } from "@/components/glass/GlassSurface";

/**
 * A headline number is not a chart. These carry the figures that would
 * otherwise be squeezed onto an axis they do not share.
 */
export function StatTile({
  label, value, hint, icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <GlassSurface className="p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-bold tracking-wider text-[var(--ink-faint)] uppercase">
          {label}
        </span>
        {icon && <span className="text-[var(--accent)]">{icon}</span>}
      </div>
      {/* Values wear ink tokens, never a series colour. */}
      <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{hint}</p>}
    </GlassSurface>
  );
}
