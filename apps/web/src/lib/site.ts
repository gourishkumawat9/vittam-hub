/**
 * One source of truth for how VittamHub describes itself to search engines
 * and social previews: root metadata, sitemap, robots and JSON-LD all read
 * from here so the brand name and canonical origin can't drift apart.
 */
export const SITE_URL = "https://vittamhub.com";
export const SITE_NAME = "VittamHub";

/**
 * Other ways people write the name. Google reads `alternateName` on the
 * WebSite schema when picking the site name it shows in results, and it
 * helps "Vittam Hub" (two words) resolve to this site.
 */
export const SITE_ALTERNATE_NAMES = ["Vittam Hub", "vittamhub.com"];

export const SITE_TAGLINE = "Visibility for Tomorrow's Unicorns";

/** Brand name first: brand searches match the start of the title and description. */
export const SITE_TITLE = `${SITE_NAME} | ${SITE_TAGLINE}`;

export const SITE_DESCRIPTION =
  "VittamHub (Vittam Hub) helps founders in India go from idea to investment. Build a verified startup profile and discover investors, mentors, and incubators on one platform.";

/**
 * Official VittamHub profiles elsewhere (LinkedIn, Instagram, X, YouTube,
 * Crunchbase…). They become the Organization schema's `sameAs`, which ties
 * those profiles to this site for search engines. Only add accounts the
 * company actually owns.
 */
export const SOCIAL_PROFILES: string[] = [];
