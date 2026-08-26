/**
 * Chart palette.
 *
 * Every form here is single-series or sequential — revenue is one line, top
 * sellers are ranked magnitude, the heatmap is density — so there is no
 * categorical palette to assign. Order count is a stat tile rather than a
 * second line, which is what keeps the revenue chart off a second y-axis.
 *
 * Dark mode has its own selected steps rather than a flipped ramp: against a
 * near-black surface the light ramp's dark end falls to 2.24:1. Verified by
 * scripts/e2e/palette-check.mjs — monotonic lightness, signal end above 3:1.
 */
export const SEQUENTIAL = {
  light: ["#eff6ff", "#bcdcff", "#8ec6ff", "#59a6ff", "#2563eb"],
  dark: ["#11224a", "#1d4ed8", "#3b82f6", "#59a6ff", "#8ec6ff"],
} as const;

export const SERIES = { light: "#2563eb", dark: "#59a6ff" } as const;

/** Bucket a value onto the ramp. Empty stays at step 0 so "none" reads as absence. */
export function rampStep(value: number, max: number, mode: "light" | "dark"): string {
  const ramp = SEQUENTIAL[mode];
  if (value <= 0 || max <= 0) return ramp[0];
  const idx = Math.min(ramp.length - 1, Math.ceil((value / max) * (ramp.length - 1)));
  return ramp[idx]!;
}
