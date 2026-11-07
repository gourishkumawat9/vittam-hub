import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * Public pages that render without the API. Add a route here when it ships
 * as a public, server-rendered page (e.g. /privacy, /terms, public startup
 * profiles); never list pages that carry a noindex tag.
 */
const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.7, changeFrequency: "monthly" },
  { path: "/register", priority: 0.6, changeFrequency: "yearly" },
  { path: "/login", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Built once at deploy time, so lastModified is the deploy date.
  const lastModified = new Date();
  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
