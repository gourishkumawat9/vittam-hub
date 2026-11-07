import type { Metadata } from "next";

/**
 * One source of truth for how VittamHub describes itself to search engines
 * and social previews. Every public page builds its metadata through
 * `pageMetadata()` below, so titles, canonical URLs and Open Graph tags can't
 * drift apart page by page.
 */

/** The one canonical origin (next.config.mjs redirects www here). */
export const SITE_URL = "https://vittamhub.com";
export const SITE_NAME = "VittamHub";
/**
 * Other ways people type the name ("Vittam Hub" is how it's usually said
 * out loud). Listed in structured data so search engines treat every
 * spelling as the same brand.
 */
export const SITE_ALTERNATE_NAMES = ["Vittam Hub", "Vittamhub"];
export const SITE_TAGLINE = "Visibility for Tomorrow's Unicorns";
export const HOME_TITLE = `${SITE_NAME}: ${SITE_TAGLINE}`;
/** Kept under ~160 characters so Google shows it whole. Describes only what the site actually offers today. */
export const SITE_DESCRIPTION =
  "VittamHub (Vittam Hub) is the digital identity platform for startups, from idea to unicorn. Build trust and connect with investors, mentors and incubators.";

/**
 * VittamHub's official profiles elsewhere (LinkedIn, Instagram, X, YouTube…).
 * Search engines use these `sameAs` links to tie the profiles to the site,
 * which strengthens the brand result for "VittamHub". Add a URL only once
 * the profile really exists and links back to vittamhub.com.
 */
export const SOCIAL_PROFILES: string[] = [];

/** The social preview card (rendered by app/opengraph-image.tsx and app/twitter-image.tsx). */
export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 };
export const SOCIAL_IMAGE_ALT = HOME_TITLE;

/**
 * Shared Open Graph fields every page carries. A page's `openGraph` replaces
 * its parent's wholesale, including the image Next.js would otherwise add
 * from app/opengraph-image.tsx, so these are spread back in each time.
 */
const BASE_OPEN_GRAPH = {
  type: "website" as const,
  siteName: SITE_NAME,
  locale: "en_IN",
  images: [{ url: "/opengraph-image", ...SOCIAL_IMAGE_SIZE, alt: SOCIAL_IMAGE_ALT, type: "image/png" }],
};

interface PageSeo {
  /** Shown as "<title> · VittamHub" unless `absoluteTitle` is set. */
  title: string;
  description: string;
  /** Path of this page's canonical URL, e.g. "/about". */
  path: string;
  /** Use the title exactly as given, without the " · VittamHub" suffix (the home page). */
  absoluteTitle?: boolean;
}

/**
 * Metadata for an indexable public page: title, description, a canonical URL
 * pointing at the page itself, and matching Open Graph / Twitter tags.
 */
export function pageMetadata({ title, description, path, absoluteTitle = false }: PageSeo): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} · ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { ...BASE_OPEN_GRAPH, url: path, title: fullTitle, description },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [{ url: "/twitter-image", ...SOCIAL_IMAGE_SIZE, alt: SOCIAL_IMAGE_ALT }],
    },
  };
}

/** For app screens (dashboards, onboarding, password resets) that have no business in search results. Links on them are still followed. */
export const NO_INDEX: Metadata["robots"] = { index: false, follow: true };
