/**
 * VittamHub color tokens.
 * `brand` is a deep "trust blue" scale (hue ~216°), 600 = primary, 950 = navy.
 * Why a dark blue: blue is the colour people most associate with trust online, and
 * in Broeder & Snijder's test the dark-blue version of a site was rated more
 * trustworthy than the light-blue one ("Colour in online advertising: going for
 * trust, which blue is a must?", MID Journal 2(1), 2019, doi:10.2478/midj-2019-0001).
 * It also clears WCAG AA: white on 600 is 6.4:1, 600 on white is 6.4:1, and 700
 * on 100 (badges, active nav) is 6.7:1. The official logo's lighter blue (#7DB2E3)
 * sits close to 300 and is used on navy (950), where it reads at 7.6:1.
 * `neutral` / `slate` and the semantic scales reuse the exact Tailwind v3 palette values
 * that the brand hexes (#F8FAFC, #0F172A, #020617, #E5E7EB, #111827, #6B7280, and the
 * success/warning/danger/info hexes) already correspond to — so tokens here match Tailwind
 * one-for-one and there is no drift between "our" palette and the Tailwind config.
 */

export const brand = {
  50: "#EFF4FB",
  100: "#DEE8F7",
  200: "#BCD1F0",
  300: "#8BAFE4", // Logo-adjacent light blue — accents on navy
  400: "#5E8DD4", // Secondary Blue
  500: "#2E6FD1", // Primary on dark surfaces (buttons)
  600: "#1E5CB8", // Primary Brand — trust, professionalism, confidence
  700: "#174C9B", // Hover / pressed
  800: "#143B7B",
  900: "#0F2957",
  950: "#0B1B38", // Navy — hero bands, footer, auth panel
} as const;

/** Text / border scale (Tailwind `gray`). */
export const neutral = {
  50: "#F9FAFB",
  100: "#F3F4F6",
  200: "#E5E7EB", // Border
  300: "#D1D5DB",
  400: "#9CA3AF",
  500: "#6B7280", // Secondary Text
  600: "#4B5563",
  700: "#374151",
  800: "#1F2937",
  900: "#111827", // Primary Text / Dark-mode Card
  950: "#030712",
} as const;

/** Surface scale (Tailwind `slate`) — used for backgrounds and dark-mode surfaces. */
export const slate = {
  50: "#F8FAFC", // Secondary Background (light mode)
  100: "#F1F5F9",
  200: "#E2E8F0",
  300: "#CBD5E1",
  400: "#94A3B8",
  500: "#64748B",
  600: "#475569",
  700: "#334155",
  800: "#1E293B",
  900: "#0F172A", // Primary Dark — authority, security, enterprise
  950: "#020617", // Dark-mode Background
} as const;

export const success = {
  50: "#F0FDF4",
  100: "#DCFCE7",
  500: "#22C55E",
  600: "#16A34A", // Success
  700: "#15803D",
} as const;

export const warning = {
  50: "#FFFBEB",
  100: "#FEF3C7",
  500: "#F59E0B", // Warning
  600: "#D97706",
} as const;

export const danger = {
  50: "#FEF2F2",
  100: "#FEE2E2",
  500: "#EF4444",
  600: "#DC2626", // Danger
  700: "#B91C1C",
} as const;

export const info = {
  50: "#EFF6FF",
  100: "#DBEAFE",
  500: "#3B82F6", // Info
  600: "#2563EB",
} as const;

/**
 * Semantic aliases — components should reference these, never raw scale steps,
 * so a future rebrand only touches this file.
 */
export const semanticColors = {
  light: {
    background: "#FFFFFF",
    backgroundSecondary: slate[50],
    surface: "#FFFFFF",
    border: neutral[200],
    borderStrong: neutral[300],
    textPrimary: neutral[900],
    textSecondary: neutral[500],
    textOnBrand: "#FFFFFF",
    brandPrimary: brand[600],
    brandSecondary: brand[400],
    brandDark: brand[950],
    success: success[600],
    successBg: success[50],
    warning: warning[500],
    warningBg: warning[50],
    danger: danger[600],
    dangerBg: danger[50],
    info: info[500],
    infoBg: info[50],
    focusRing: brand[600],
  },
  dark: {
    background: slate[950],
    backgroundSecondary: "#0B1220",
    surface: neutral[900],
    border: neutral[800],
    borderStrong: neutral[700],
    textPrimary: "#F1F5F9",
    textSecondary: "#94A3B8",
    textOnBrand: "#FFFFFF",
    // Text-first on dark: #4583DE reads at 4.7:1+ on every dark surface; buttons use brand[500] for white text.
    brandPrimary: "#4583DE",
    brandSecondary: brand[400],
    brandDark: brand[950],
    success: success[500],
    successBg: "rgba(34,197,94,0.12)",
    warning: warning[500],
    warningBg: "rgba(245,158,11,0.12)",
    danger: danger[500],
    dangerBg: "rgba(239,68,68,0.12)",
    info: info[500],
    infoBg: "rgba(59,130,246,0.12)",
    focusRing: brand[400],
  },
} as const;

export type ColorScale = typeof brand;
export type SemanticTheme = keyof typeof semanticColors;
