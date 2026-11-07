import { SITE_ALTERNATE_NAMES, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL, SOCIAL_PROFILES } from "@/lib/seo";

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/**
 * Organization + WebSite structured data, rendered on the home page (where
 * Google reads the WebSite entry to decide the "site name" it shows above
 * the result). `alternateName` tells it "Vittam Hub" and "Vittamhub" are
 * this same site.
 *
 * No SearchAction: the home page has no `?q=` search for it to point at,
 * and Google retired the sitelinks search box in 2024 anyway.
 */
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      alternateName: SITE_ALTERNATE_NAMES,
      url: SITE_URL,
      // The official square mark (CLAUDE.md §1), large enough for Google's 112px minimum.
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brand/vittamhub-icon.png`,
        width: 1024,
        height: 1024,
      },
      slogan: SITE_TAGLINE,
      description: SITE_DESCRIPTION,
      ...(SOCIAL_PROFILES.length > 0 ? { sameAs: SOCIAL_PROFILES } : {}),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: SITE_ALTERNATE_NAMES,
      url: `${SITE_URL}/`,
      description: SITE_DESCRIPTION,
      inLanguage: "en-IN",
      publisher: { "@id": ORGANIZATION_ID },
    },
  ],
};

/** `<` is escaped so no string in the data can ever close the script tag early. */
const SERIALIZED = JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c");

/** Server component: static JSON-LD, no client JS. */
export function JsonLd() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SERIALIZED }} />;
}
