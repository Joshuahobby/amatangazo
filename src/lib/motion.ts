import type { Variants } from "framer-motion";

/*
 * One canonical motion vocabulary for the marketing surfaces so every section
 * enters the same way. Only `transform` and `opacity` animate — both are
 * compositor-only properties, cheap on the low-end Android devices that
 * dominate our market (never animate layout/filter). Reduced-motion is handled
 * globally by <MotionConfig reducedMotion="user"> in motion-provider.tsx, so
 * these variants don't need their own guards.
 */

/** Canonical entrance: fade in with a short rise. Use for single elements. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/** Parent that reveals its children in sequence. Pair each child with `fadeUp`. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

/** Shared whileInView viewport config: play once, trigger a little early. */
export const viewportOnce = { once: true, margin: "-80px" } as const;
