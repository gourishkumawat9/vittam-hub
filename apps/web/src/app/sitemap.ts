import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

/**
 * Every public page that should appear in search, and nothing else: each one
 * sets a canonical URL to itself. Add new public pages (blog posts, server-
 * rendered startup profiles…) here as they ship.
 *
 * No `lastModified`: stamping every URL with the build time on each deploy
 * makes the date meaningless, and Google ignores dates that aren't accurate.
 */
const PUBLIC_ROUTES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/about", priority: 0.8 },
  { path: "/pricing", priority: 0.7 },
  { path: "/register", priority: 0.6 },
  { path: "/login", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map(({ path, priority }) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority,
  }));
}
