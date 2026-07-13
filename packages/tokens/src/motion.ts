/**
 * Motion tokens for Framer Motion. Durations in seconds. Easings tuned to feel
 * calm and deliberate (no bounce/spring on enterprise surfaces; reserve spring
 * for small delight moments like counters and success states).
 */
export const duration = {
  instant: 0.1,
  fast: 0.16,
  base: 0.24,
  slow: 0.36,
  slower: 0.5,
} as const;

export const easing = {
  standard: [0.4, 0, 0.2, 1], // Material-ish standard ease
  decelerate: [0, 0, 0.2, 1], // entrances
  accelerate: [0.4, 0, 1, 1], // exits
  spring: { type: "spring", stiffness: 260, damping: 24 },
} as const;

/** Reusable Framer Motion variants — import directly into components. */
export const motionVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: duration.base, ease: easing.standard } },
    exit: { opacity: 0, transition: { duration: duration.fast, ease: easing.accelerate } },
  },
  fadeSlideUp: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: duration.base, ease: easing.decelerate } },
    exit: { opacity: 0, y: 8, transition: { duration: duration.fast, ease: easing.accelerate } },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1, transition: { duration: duration.base, ease: easing.decelerate } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: duration.fast, ease: easing.accelerate } },
  },
  cardHover: {
    rest: { y: 0, boxShadow: "var(--shadow-sm)" },
    hover: { y: -4, boxShadow: "var(--shadow-lg)", transition: { duration: duration.fast, ease: easing.standard } },
  },
  buttonTap: {
    rest: { scale: 1 },
    hover: { scale: 1.02, transition: { duration: duration.instant } },
    tap: { scale: 0.98, transition: { duration: duration.instant } },
  },
  staggerContainer: {
    animate: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
  },
} as const;

/** Respect `prefers-reduced-motion`: components should check this and fall back to fadeIn/opacity-only. */
export const reducedMotionFallback = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.fast } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
} as const;
