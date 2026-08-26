"use client";

import { useMemo, useState } from "react";
import { Table2, Grid3x3 } from "lucide-react";
import type { PeakCellDto } from "@/lib/admin/analytics";
import { rampStep, SEQUENTIAL } from "@/lib/admin/palette";
import { useTheme } from "@/components/system/ThemeProvider";
import { GlassButton } from "@/components/glass/GlassButton";

const DAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
// All 24 hours: CreatedAt.Hour is 0–23, and the café trades past midnight
// (10:00–06:00), so any narrower window would hide real orders.
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function PeakHeatmap({ cells }: { cells: PeakCellDto[] }) {
  const { resolved } = useTheme();
  const [asTable, setAsTable] = useState(false);
  const [hover, setHover] = useState<PeakCellDto | null>(null);

  const { lookup, max } = useMemo(() => {
    const lookup = new Map<string, PeakCellDto>();
    let max = 0;
    for (const c of cells) {
      lookup.set(`${c.dayOfWeek}:${c.hour}`, c);
      max = Math.max(max, c.orderCount);
    }
    return { lookup, max };
  }, [cells]);

  const ramp = SEQUENTIAL[resolved];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] text-[var(--ink-faint)]">
          <span>az</span>
          {ramp.map((c) => (
            <span key={c} className="size-3 rounded-sm" style={{ background: c }} />
          ))}
          <span>çok</span>
        </div>
        {/* The pale end of a density ramp cannot clear 3:1, so the table view
            is a requirement rather than a nicety. */}
        <GlassButton variant="ghost" size="sm" onClick={() => setAsTable((v) => !v)} className="gap-1.5">
          {asTable ? <Grid3x3 className="size-3.5" /> : <Table2 className="size-3.5" />}
          {asTable ? "Isı haritası" : "Tablo"}
        </GlassButton>
      </div>

      {asTable ? (
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Gün ve saate göre sipariş sayısı</caption>
            <thead className="sticky top-0 bg-[var(--surface)]">
              <tr className="text-left text-[11px] tracking-wider text-[var(--ink-faint)] uppercase">
                <th scope="col" className="py-1.5">Gün</th>
                <th scope="col">Saat</th>
                <th scope="col" className="text-right">Sipariş</th>
              </tr>
            </thead>
            <tbody>
              {cells.slice().sort((a, b) => b.orderCount - a.orderCount).map((c) => (
                <tr key={`${c.dayOfWeek}:${c.hour}`} className="border-t border-[var(--hairline)]">
                  <td className="py-1.5">{DAYS[c.dayOfWeek]}</td>
                  <td className="tabular-nums">{String(c.hour).padStart(2, "0")}:00</td>
                  <td className="text-right font-semibold tabular-nums">{c.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="flex gap-[2px] pl-[calc(2.25rem+2px)]">
              {HOURS.map((h) => (
                <span key={h} className="w-5 text-center text-[9px] text-[var(--ink-faint)] tabular-nums">
                  {h % 3 === 0 ? h : ""}
                </span>
              ))}
            </div>
            {DAYS.map((label, dow) => (
              <div key={label} className="flex items-center gap-[2px]">
                <span className="w-9 text-[10px] font-medium text-[var(--ink-faint)]">{label}</span>
                {HOURS.map((h) => {
                  const cell = lookup.get(`${dow}:${h}`);
                  const count = cell?.orderCount ?? 0;
                  return (
                    <button
                      key={h}
                      type="button"
                      onMouseEnter={() => cell && setHover(cell)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => cell && setHover(cell)}
                      onBlur={() => setHover(null)}
                      // 2px surface gap between fills, per mark specs.
                      className="size-5 shrink-0 rounded-sm transition-transform hover:scale-125"
                      style={{ background: rampStep(count, max, resolved) }}
                      aria-label={`${label} ${h}:00 — ${count} sipariş`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {hover && (
            <div className="glass-legible pointer-events-none absolute top-0 right-0 rounded-[var(--radius-card)] px-3 py-2 text-xs">
              <span className="block font-semibold">
                {DAYS[hover.dayOfWeek]} {String(hover.hour).padStart(2, "0")}:00
              </span>
              <span className="block tabular-nums">{hover.orderCount} sipariş</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
