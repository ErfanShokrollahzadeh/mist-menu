"use client";

import { useId, useMemo, useState } from "react";
import type { RevenuePointDto } from "@/lib/admin/analytics";
import { SERIES } from "@/lib/admin/palette";
import { useTheme } from "@/components/system/ThemeProvider";
import { formatPrice } from "@/lib/menu";

const W = 720, H = 240, PAD = { t: 12, r: 12, b: 26, l: 52 };

/** Single series, so the title names it and no legend box is needed. */
export function RevenueLine({ points }: { points: RevenuePointDto[] }) {
  const { resolved } = useTheme();
  const stroke = SERIES[resolved];
  const clipId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const geom = useMemo(() => {
    if (points.length === 0) return null;
    const max = Math.max(...points.map((p) => p.revenueMinor), 1);
    const innerW = W - PAD.l - PAD.r;
    const innerH = H - PAD.t - PAD.b;
    const x = (i: number) =>
      PAD.l + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = (v: number) => PAD.t + innerH - (v / max) * innerH;
    return {
      max, x, y,
      line: points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.revenueMinor)}`).join(" "),
      area: `M${x(0)},${PAD.t + innerH} ` +
            points.map((p, i) => `L${x(i)},${y(p.revenueMinor)}`).join(" ") +
            ` L${x(points.length - 1)},${PAD.t + innerH} Z`,
    };
  }, [points]);

  if (!geom) {
    return <p className="py-10 text-center text-sm text-[var(--ink-muted)]">Bu aralıkta satış yok.</p>;
  }

  const active = hover === null ? null : points[hover];

  return (
    <figure className="relative m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Günlük ciro, ${points.length} gün`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={clipId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Recessive grid: present enough to read against, quiet enough to ignore. */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = PAD.t + (H - PAD.t - PAD.b) * f;
          return (
            <g key={f}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y}
                    stroke="currentColor" strokeWidth="1" className="text-[var(--hairline)]" />
              <text x={PAD.l - 8} y={y + 4} textAnchor="end"
                    className="fill-[var(--ink-faint)] text-[10px] tabular-nums">
                {Math.round((geom.max * (1 - f)) / 100).toLocaleString("tr-TR")}
              </text>
            </g>
          );
        })}

        <path d={geom.area} fill={`url(#${clipId})`} />
        <path d={geom.line} fill="none" stroke={stroke} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />

        {/* Crosshair on hover. */}
        {active && (
          <line x1={geom.x(hover!)} x2={geom.x(hover!)} y1={PAD.t} y2={H - PAD.b}
                stroke={stroke} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        )}
        {active && (
          <circle cx={geom.x(hover!)} cy={geom.y(active.revenueMinor)} r="5"
                  fill={stroke} stroke="var(--surface)" strokeWidth="2" />
        )}

        {/* Hit targets are wider than the marks. */}
        {points.map((p, i) => (
          <rect key={p.day} x={geom.x(i) - 12} y={PAD.t} width={24} height={H - PAD.t - PAD.b}
                fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}

        {points.map((p, i) =>
          i % Math.ceil(points.length / 7) === 0 ? (
            <text key={p.day} x={geom.x(i)} y={H - 8} textAnchor="middle"
                  className="fill-[var(--ink-faint)] text-[10px]">
              {new Date(p.day).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
            </text>
          ) : null,
        )}
      </svg>

      {active && (
        <div className="glass-legible pointer-events-none absolute top-2 right-2 rounded-[var(--radius-card)] px-3 py-2 text-xs">
          <span className="block font-semibold">
            {new Date(active.day).toLocaleDateString("tr-TR", { dateStyle: "medium" })}
          </span>
          <span className="block tabular-nums">{formatPrice(active.revenueMinor, "tr")}</span>
          <span className="block text-[var(--ink-muted)] tabular-nums">
            {active.orderCount} sipariş
          </span>
        </div>
      )}
    </figure>
  );
}
