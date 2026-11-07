import type { MetadataRoute } from "next";

const SITE_URL = "https://vittamhub.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/pricing", "/about", "/login", "/register"];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.6,
  }));
}
