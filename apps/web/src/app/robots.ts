import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Logged-in areas that redirect crawlers to /login anyway. Other
        // private pages stay crawlable on purpose so Google can read their
        // noindex tag (a disallowed page's noindex is never seen).
        disallow: ["/founder", "/investor", "/admin", "/api/", "/unavailable"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
