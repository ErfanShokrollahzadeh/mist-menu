"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * The multi-layer mesh gradient the whole glass system sits on.
 *
 * Four blurred colour fields drift on a long loop and parallax gently with
 * scroll and pointer. Implemented as four composited layers rather than the
 * previous build's ~40 animated particle divs, which cost real battery on
 * mobile for the same effect.
 */
export function AmbientBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    let sy = 0, px = 0, py = 0;

    const apply = () => {
      frame = 0;
      el.style.setProperty("--sy", `${sy}px`);
      el.style.setProperty("--px", `${px}px`);
      el.style.setProperty("--py", `${py}px`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onScroll = () => {
      sy = window.scrollY * -0.04;
      schedule();
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px = (e.clientX / window.innerWidth - 0.5) * 26;
      py = (e.clientY / window.innerHeight - 0.5) * 26;
      schedule();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ ["--sy" as string]: "0px", ["--px" as string]: "0px", ["--py" as string]: "0px" }}
    >
      <div
        className="absolute -top-[20%] -left-[15%] size-[70vmax] rounded-full blur-[110px] animate-drift"
        style={{
          background: "radial-gradient(circle, var(--mesh-1), transparent 68%)",
          transform: "translate3d(calc(var(--px) * 1), calc(var(--sy) + var(--py)), 0)",
        }}
      />
      <div
        className="absolute -top-[10%] -right-[20%] size-[65vmax] rounded-full blur-[120px] animate-drift"
        style={{
          background: "radial-gradient(circle, var(--mesh-2), transparent 68%)",
          animationDelay: "-8s",
          transform: "translate3d(calc(var(--px) * -0.8), calc(var(--sy) * 1.4 + var(--py) * -1), 0)",
        }}
      />
      <div
        className="absolute bottom-[-25%] left-[10%] size-[60vmax] rounded-full blur-[130px] animate-drift"
        style={{
          background: "radial-gradient(circle, var(--mesh-3), transparent 70%)",
          animationDelay: "-15s",
          transform: "translate3d(calc(var(--px) * 0.5), calc(var(--sy) * -0.8), 0)",
        }}
      />
      <div
        className="absolute bottom-[-15%] right-[5%] size-[55vmax] rounded-full blur-[120px] animate-drift"
        style={{
          background: "radial-gradient(circle, var(--mesh-4), transparent 70%)",
          animationDelay: "-20s",
          transform: "translate3d(calc(var(--px) * -0.4), calc(var(--sy) * -1.2), 0)",
        }}
      />
      {/* Fine grain stops the gradients from banding on wide displays. */}
      <div
        className="absolute inset-0 opacity-[0.028] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
