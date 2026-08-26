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
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.06 } },
};

/** Child of `cascade`. Rises and settles. */
export const cascadeItem: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring.soft },
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
