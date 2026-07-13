// eslint-disable-next-line no-control-regex -- ̀-ͯ is the Unicode "Combining Diacritical Marks" block
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/** Deterministic, URL-safe slug — used for startup/investor public profile URLs (vittamhub.com/s/{slug}). */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
