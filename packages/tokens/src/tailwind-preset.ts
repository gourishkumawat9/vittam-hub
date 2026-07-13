import type { Config } from "tailwindcss";

import { brand, neutral, slate, success, warning, danger, info } from "./colors";
import { shadow } from "./shadows";
import { spacing, radius, breakpoints } from "./spacing";
import { fontFamily, fontSize, letterSpacing } from "./typography";
import { zIndex } from "./z-index";

/**
 * Shared Tailwind preset — every app extends this rather than redefining
 * scales inline, so `apps/web` and any future app (docs site, mobile web
 * view) stay pixel-identical to the design system.
 */
const preset: Partial<Config> = {
  // next-themes writes `data-theme="dark"` on <html> (see app/providers.tsx),
  // so `dark:` utilities must key off that attribute, not a `.dark` class.
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    screens: breakpoints,
    extend: {
      colors: {
        brand,
        neutral,
        slate,
        success,
        warning,
        danger,
        info,
        // Semantic CSS-variable-backed aliases (see globals.css) — enables
        // instant light/dark theming without duplicating Tailwind classes.
        background: "rgb(var(--color-background) / <alpha-value>)",
        "background-secondary": "rgb(var(--color-background-secondary) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        "text-primary": "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
        "brand-primary": "rgb(var(--color-brand-primary) / <alpha-value>)",
        "brand-secondary": "rgb(var(--color-brand-secondary) / <alpha-value>)",
      },
      // Tailwind's Config type wants mutable string[]; fontFamily's `as const`
      // tuples are readonly, so spread each into a fresh mutable array.
      fontFamily: Object.fromEntries(Object.entries(fontFamily).map(([key, value]) => [key, [...value]])),
      fontSize: Object.fromEntries(
        Object.entries(fontSize).map(([key, { size, lineHeight }]) => [key, [size, { lineHeight }]]),
      ),
      letterSpacing,
      spacing,
      borderRadius: radius,
      boxShadow: shadow,
      zIndex: Object.fromEntries(Object.entries(zIndex).map(([k, v]) => [k, String(v)])),
      maxWidth: {
        content: "1440px",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
        decelerate: "cubic-bezier(0, 0, 0.2, 1)",
        accelerate: "cubic-bezier(0.4, 0, 1, 1)",
      },
    },
  },
  plugins: [],
};

export default preset;
