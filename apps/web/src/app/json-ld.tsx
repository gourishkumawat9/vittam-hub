import { SITE_ALTERNATE_NAMES, SITE_DESCRIPTION, SITE_NAME, SITE_URL, SOCIAL_PROFILES } from "@/lib/site";

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAMES,
  url: SITE_URL,
  // The official 1024×1024 mark: Google wants a square logo of at least 112px.
  logo: `${SITE_URL}/brand/vittamhub-icon.png`,
  description: SITE_DESCRIPTION,
  ...(SOCIAL_PROFILES.length > 0 && { sameAs: SOCIAL_PROFILES }),
};

/**
 * `name` + `alternateName` here is what Google uses to choose the site name
 * shown above each result. No SearchAction: the home page has no `?q=`
 * search, and Google retired the sitelinks search box in 2024.
 */
const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAMES,
  url: `${SITE_URL}/`,
  description: SITE_DESCRIPTION,
  inLanguage: "en-IN",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

/** Server component — renders static JSON-LD, no client JS needed. */
export function JsonLd() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }} />
    </>
  );
}
