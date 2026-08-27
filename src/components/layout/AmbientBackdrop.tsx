import type { CSSProperties } from "react";

/**
 * The multi-layer mesh gradient the whole glass system sits on.
 *
 * This is a *static* paint, deliberately. It used to be four `blur(110-130px)`
 * divs drifting on an infinite loop under a `mix-blend-overlay` grain layer.
 * That was the single most expensive thing on the page: `backdrop-filter`
 * samples whatever is behind it, so a backdrop that never stops changing
 * invalidates the cached filter of every glass surface above it — up to ~255 of
 * them on the cold-drinks tab — on every frame, forever, even while idle. The
 * compositor was saturated before the user had touched anything.
 *
 * The same four fields are now four `radial-gradient()` background layers on one
 * element, with their centres expressed in the same `calc()` geometry the
 * absolutely-positioned divs resolved to, so the composition is unchanged. The
 * eased colour stops stand in for the Gaussian falloff the blur used to provide,
 * and the grain blends inside this element's own background stack rather than
 * against the page, which avoids creating a blend group.
 *
 * No filter, no animation, no listeners — so it is also a server component now,
 * and costs nothing in the client bundle.
 */

/** 140x140 tiling fractal noise; the opacity is baked in so the layer needs no wrapper. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.028'/%3E%3C/svg%3E\")";

/**
 * One field. `radius` is half the old element's `size-[Nvmax]`, and `cx`/`cy`
 * are where that element's centre landed once its inset offsets resolved.
 */
function field(cx: string, cy: string, radius: string, color: string, edge: number) {
  return [
    `radial-gradient(circle ${radius} at ${cx} ${cy}`,
    `${color} 0%`,
    `color-mix(in oklab, ${color}, transparent 30%) ${Math.round(edge * 0.44)}%`,
    `color-mix(in oklab, ${color}, transparent 70%) ${Math.round(edge * 0.76)}%`,
    // The tail runs past the old hard stop because a 110px blur used to bleed
    // colour well beyond the element's own box.
    `transparent ${edge + 10}%)`,
  ].join(", ");
}

const MESH = [
  GRAIN,
  // was: -top-[20%] -left-[15%] size-[70vmax] blur-[110px]
  field("calc(-15% + 35vmax)", "calc(-20% + 35vmax)", "35vmax", "var(--mesh-1)", 68),
  // was: -top-[10%] -right-[20%] size-[65vmax] blur-[120px]
  field("calc(120% - 32.5vmax)", "calc(-10% + 32.5vmax)", "32.5vmax", "var(--mesh-2)", 68),
  // was: bottom-[-25%] left-[10%] size-[60vmax] blur-[130px]
  field("calc(10% + 30vmax)", "calc(125% - 30vmax)", "30vmax", "var(--mesh-3)", 70),
  // was: bottom-[-15%] right-[5%] size-[55vmax] blur-[120px]
  field("calc(105% - 27.5vmax)", "calc(115% - 27.5vmax)", "27.5vmax", "var(--mesh-4)", 70),
].join(", ");

const style: CSSProperties = {
  backgroundImage: MESH,
  // Grain sits on top of the four fields and blends only against them.
  backgroundBlendMode: "overlay, normal, normal, normal, normal",
  backgroundRepeat: "repeat, no-repeat, no-repeat, no-repeat, no-repeat",
};

export function AmbientBackdrop() {
  return <div aria-hidden className="pointer-events-none fixed inset-0 -z-10" style={style} />;
}
