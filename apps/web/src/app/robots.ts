import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

/**
 * Only signed-in areas that redirect to /login are blocked here. Other app
 * screens carry a `noindex` meta tag instead, which crawlers can only see if
 * they're allowed to fetch the page, so they must not be disallowed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/founder", "/investor", "/admin", "/api/", "/unavailable"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
