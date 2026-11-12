const base =
  "inline-flex items-center justify-center gap-2 rounded-button px-6 py-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

/**
 * Link-as-button styles for the marketing pages (dashboards use <Button> from
 * @vittamhub/ui). Colour changes on hover, no movement.
 */
export const cta = {
  /** Trust blue on white or grey: white text at 6.4:1. */
  primary: `${base} bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-600 dark:bg-brand-500 dark:hover:bg-brand-600`,
  /** On navy: the brighter 500 (white text 4.9:1) so the button still stands off the background. */
  onNavy: `${base} bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-white focus-visible:ring-offset-brand-950`,
  /** White button for the trust-blue band. */
  white: `${base} bg-white text-brand-800 hover:bg-brand-50 focus-visible:ring-white focus-visible:ring-offset-brand-600`,
  /** Outline on navy or blue. */
  outlineOnDark: `${base} border border-white/40 text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-brand-950`,
  /** Outline on white or grey. */
  outline: `${base} border border-border bg-surface text-text-primary hover:bg-background-secondary focus-visible:ring-brand-600`,
} as const;
