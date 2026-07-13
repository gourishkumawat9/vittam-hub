/**
 * Type system. Four families, each with one job — never mix them.
 *
 * Each stack leads with a `var(--font-*)` custom property, not a literal font
 * name — next/font (see apps/web/src/lib/fonts.ts) self-hosts each Google
 * Font under a hashed internal family name and only exposes it through that
 * CSS variable on <body>. Referencing "Manrope" as a literal string here
 * would silently fail to pick up the loaded font. The literal name after the
 * variable is a plain-CSS fallback for contexts without next/font (e.g. a
 * future Storybook build), not the primary path.
 */

export const fontFamily = {
  // Nested var(..., fallback) so an unset custom property degrades gracefully
  // instead of making the whole font-family declaration invalid-at-computed-
  // value-time (which would silently drop it to the inherited font instead).
  brand: ["var(--font-brand, var(--font-heading, Manrope))", "sans-serif"], // Logo / wordmark only — falls back to the heading font until Henderson Sans is wired up, see apps/web/src/lib/fonts.ts
  heading: ["var(--font-heading, Manrope)", "Inter", "sans-serif"], // H1–H6, nav, card titles
  body: ["var(--font-body, Inter)", "-apple-system", "BlinkMacSystemFont", "sans-serif"], // Paragraphs, labels, UI copy
  numeric: ["var(--font-numeric, \"IBM Plex Sans\")", "Inter", "sans-serif"], // Metrics, currency, stats, tables
  mono: ["var(--font-mono, \"JetBrains Mono\")", "ui-monospace", "SFMono-Regular", "monospace"], // Code, API keys, hashes
} as const;

/** Fluid-ish type scale in rem (1rem = 16px). Line-height paired per size. */
export const fontSize = {
  xs: { size: "0.75rem", lineHeight: "1rem" }, // 12/16
  sm: { size: "0.875rem", lineHeight: "1.25rem" }, // 14/20
  base: { size: "1rem", lineHeight: "1.5rem" }, // 16/24
  lg: { size: "1.125rem", lineHeight: "1.75rem" }, // 18/28
  xl: { size: "1.25rem", lineHeight: "1.75rem" }, // 20/28
  "2xl": { size: "1.5rem", lineHeight: "2rem" }, // 24/32
  "3xl": { size: "1.875rem", lineHeight: "2.25rem" }, // 30/36
  "4xl": { size: "2.25rem", lineHeight: "2.5rem" }, // 36/40
  "5xl": { size: "3rem", lineHeight: "1.1" }, // 48
  "6xl": { size: "3.75rem", lineHeight: "1.05" }, // 60
  "7xl": { size: "4.5rem", lineHeight: "1" }, // 72
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const letterSpacing = {
  tighter: "-0.02em", // large display headings
  tight: "-0.01em", // H1–H3
  normal: "0",
  wide: "0.01em", // eyebrow / overline labels
  wider: "0.04em", // all-caps micro labels
} as const;

/**
 * Named semantic styles — this is what components should consume
 * (e.g. `text.h1`, `text.bodyBase`), not raw fontSize/weight combos.
 */
export const textStyles = {
  display: { font: fontFamily.heading, size: fontSize["7xl"], weight: fontWeight.bold, tracking: letterSpacing.tighter },
  h1: { font: fontFamily.heading, size: fontSize["5xl"], weight: fontWeight.bold, tracking: letterSpacing.tight },
  h2: { font: fontFamily.heading, size: fontSize["4xl"], weight: fontWeight.bold, tracking: letterSpacing.tight },
  h3: { font: fontFamily.heading, size: fontSize["3xl"], weight: fontWeight.semibold, tracking: letterSpacing.tight },
  h4: { font: fontFamily.heading, size: fontSize["2xl"], weight: fontWeight.semibold, tracking: letterSpacing.normal },
  h5: { font: fontFamily.heading, size: fontSize.xl, weight: fontWeight.semibold, tracking: letterSpacing.normal },
  h6: { font: fontFamily.heading, size: fontSize.lg, weight: fontWeight.semibold, tracking: letterSpacing.normal },
  bodyLg: { font: fontFamily.body, size: fontSize.lg, weight: fontWeight.regular, tracking: letterSpacing.normal },
  bodyBase: { font: fontFamily.body, size: fontSize.base, weight: fontWeight.regular, tracking: letterSpacing.normal },
  bodySm: { font: fontFamily.body, size: fontSize.sm, weight: fontWeight.regular, tracking: letterSpacing.normal },
  label: { font: fontFamily.body, size: fontSize.sm, weight: fontWeight.medium, tracking: letterSpacing.normal },
  overline: { font: fontFamily.body, size: fontSize.xs, weight: fontWeight.semibold, tracking: letterSpacing.wider },
  metricLg: { font: fontFamily.numeric, size: fontSize["5xl"], weight: fontWeight.bold, tracking: letterSpacing.tight },
  metricBase: { font: fontFamily.numeric, size: fontSize["2xl"], weight: fontWeight.semibold, tracking: letterSpacing.normal },
  code: { font: fontFamily.mono, size: fontSize.sm, weight: fontWeight.regular, tracking: letterSpacing.normal },
} as const;
