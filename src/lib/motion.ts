import type { Transition, Variants } from "motion/react";

/** Physics that feel like weight, not like easing curves. */
export const spring = {
  soft: { type: "spring", stiffness: 260, damping: 30, mass: 0.9 },
  snappy: { type: "spring", stiffness: 420, damping: 32, mass: 0.7 },
  gentle: { type: "spring", stiffness: 160, damping: 24, mass: 1 },
} satisfies Record<string, Transition>;

/** Parent of a staggered cascade — grids, rails, lists. */
export const cascade: Variants = {
  hidden: {},
  // 0.045 put the last card of the 20-item dessert grid at ~0.96s, which reads
  // as the section still loading. Tightened, but deliberately not to ~0: a
  // shorter stagger means *more* cards animating at once, and each one is a
  // backdrop-filtered surface.
  show: { transition: { staggerChildren: 0.03, delayChildren: 0.05 } },
};

/**
 * Child of `cascade`. Rises and settles.
 *
 * No `scale` here. Every card is a `backdrop-filter` surface, and scaling one
 * resamples the filtered backdrop on each frame of the spring — the single most
 * expensive way to animate this element. `y` moves it over a static backdrop,
 * which is much cheaper, and reads almost identically.
 */
export const cascadeItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: spring.soft },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: spring.soft },
};

/** Bottom sheets and drawers. */
export const sheet: Variants = {
  hidden: { y: "100%" },
  show: { y: 0, transition: spring.snappy },
  exit: { y: "100%", transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: spring.snappy },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

/** Shared `layoutId` for the morphing nav indicator. */
export const NAV_INDICATOR = "mist-nav-indicator";
