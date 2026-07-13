/**
 * VittamHub color tokens.
 * `brand` is our custom scale anchored on the spec hexes (400 = secondary, 600 = primary).
 * `neutral` / `slate` and the semantic scales reuse the exact Tailwind v3 palette values
 * that the brand hexes (#F8FAFC, #0F172A, #020617, #E5E7EB, #111827, #6B7280, and the
 * success/warning/danger/info hexes) already correspond to — so tokens here match Tailwind
 * one-for-one and there is no drift between "our" palette and the Tailwind config.
 */

export const brand = {
  50: "#F4F8FC",
  100: "#E7F0F9",
  200: "#CEE0F3",
  300: "#A9C7E6",
  400: "#7EA7D8", // Secondary Blue — innovation, future, technology
  500: "#6C97CE",
  600: "#5F89C8", // Primary Brand — trust, professionalism, confidence
  700: "#4D71A8",
  800: "#3D5A85",
  900: "#2F4767",
  950: "#1D2C40",
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
    brandDark: slate[900],
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
    brandPrimary: brand[500],
    brandSecondary: brand[400],
    brandDark: slate[900],
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
