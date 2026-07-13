import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/founder", "/investor", "/admin", "/api/"],
      },
    ],
    sitemap: "https://vittamhub.com/sitemap.xml",
  };
}
