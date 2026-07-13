const SITE_URL = "https://vittamhub.com";

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "VittamHub",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description:
    "VittamHub is the verified digital identity and discovery platform connecting startups with investors, mentors, incubators, universities, and strategic partners.",
  sameAs: [],
};

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "VittamHub",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
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
