export type CurrencyCode = "INR" | "USD";

const LOCALE_BY_CURRENCY: Record<CurrencyCode, string> = {
  INR: "en-IN",
  USD: "en-US",
};

/** Compact currency formatting for metrics (e.g. "₹2.4M raised"). Uses IBM Plex Sans numeric styling in UI.
 *  Defaults to INR — VittamHub's default currency (CLAUDE.md §7) — pass `currency` for USD rows. */
export function formatCompactMoney(amount: number, currency: CurrencyCode = "INR"): string {
  return new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency], {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatMoney(amount: number, currency: CurrencyCode = "INR"): string {
  return new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** @deprecated use formatCompactMoney — kept temporarily for callers still passing USD explicitly. */
export function formatCompactUsd(amountUsd: number): string {
  return formatCompactMoney(amountUsd, "USD");
}

/** @deprecated use formatMoney — kept temporarily for callers still passing USD explicitly. */
export function formatUsd(amountUsd: number): string {
  return formatMoney(amountUsd, "USD");
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) return rtf.format(-diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(-diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return rtf.format(-diffDays, "day");
  const diffMonths = Math.round(diffDays / 30);
  return rtf.format(-diffMonths, "month");
}
