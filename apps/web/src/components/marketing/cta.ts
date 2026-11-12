const base =
  "inline-flex items-center justify-center gap-2 rounded-button px-6 py-3.5 text-sm font-semibold transition-[transform,background-color] hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

/**
 * Link-as-button styles for the marketing pages (dashboards use <Button> from
 * @vittamhub/ui), with the same slight scale on hover as the home page's own
 * buttons.
 */
export const cta = {
  /** Brand blue on white or grey. */
  primary: `${base} bg-brand-primary text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-primary`,
  /** White button on a blue band. */
  white: `${base} bg-white text-brand-800 shadow-sm hover:bg-brand-50 focus-visible:ring-white focus-visible:ring-offset-brand-700`,
  /** Outline on a blue band. */
  outlineOnBlue: `${base} border border-white/50 text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-brand-700`,
  /** Outline on white or grey. */
  outline: `${base} border border-border bg-surface text-text-primary hover:bg-background-secondary focus-visible:ring-brand-primary`,
} as const;
