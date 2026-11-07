import type { Metadata } from "next";

import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_TITLE } from "@/lib/site";

interface PageSeo {
  /** Page name, e.g. "About". Omit on the home page to use the full brand title. */
  title?: string;
  description?: string;
  /** Path of this page's own URL, e.g. "/about". Becomes its canonical and og:url. */
  path: string;
}

/**
 * Metadata for an indexable page. Spells out the whole openGraph/twitter
 * block because Next.js replaces (not merges) a parent's `openGraph` object
 * when a page sets its own, which would otherwise drop siteName and locale.
 */
export function pageMetadata({ title, description = SITE_DESCRIPTION, path }: PageSeo): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_TITLE;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    // The images are listed by hand for the same reason: once a page sets
    // openGraph/twitter itself, the root opengraph-image is no longer added.
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_IN",
      url: path,
      title: fullTitle,
      description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME}: ${SITE_TAGLINE}` }],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: ["/twitter-image"] },
  };
}

/** For pages that must never appear in search results (sign-in flows, the logged-in app). */
export const NO_INDEX: Metadata["robots"] = { index: false, follow: false };
