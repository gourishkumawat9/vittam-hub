/**
 * Soft, low-opacity shadows only. No heavy material/skeuomorphic elevation —
 * depth should read as "premium paper," not "floating plastic."
 */
export const shadow = {
  none: "none",
  xs: "0 1px 2px rgba(15, 23, 42, 0.04)",
  sm: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
  md: "0 4px 8px rgba(15, 23, 42, 0.06), 0 2px 4px rgba(15, 23, 42, 0.04)",
  lg: "0 12px 24px rgba(15, 23, 42, 0.08), 0 4px 8px rgba(15, 23, 42, 0.04)",
  xl: "0 24px 48px rgba(15, 23, 42, 0.10), 0 8px 16px rgba(15, 23, 42, 0.05)",
  focusRing: "0 0 0 3px rgba(95, 137, 200, 0.35)", // brand-600 @ 35%
} as const;

export const shadowDark = {
  none: "none",
  xs: "0 1px 2px rgba(0, 0, 0, 0.24)",
  sm: "0 1px 3px rgba(0, 0, 0, 0.32), 0 1px 2px rgba(0, 0, 0, 0.24)",
  md: "0 4px 8px rgba(0, 0, 0, 0.36), 0 2px 4px rgba(0, 0, 0, 0.24)",
  lg: "0 12px 24px rgba(0, 0, 0, 0.44), 0 4px 8px rgba(0, 0, 0, 0.28)",
  xl: "0 24px 48px rgba(0, 0, 0, 0.56), 0 8px 16px rgba(0, 0, 0, 0.32)",
  focusRing: "0 0 0 3px rgba(126, 167, 216, 0.45)", // brand-400 @ 45%
} as const;
