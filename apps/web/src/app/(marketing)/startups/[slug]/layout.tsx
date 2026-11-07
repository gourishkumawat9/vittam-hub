import type { Metadata } from "next";

import { NO_INDEX } from "@/lib/seo";

/**
 * Public startup profiles load their data in the browser, so the HTML a
 * crawler gets has no startup name, title or description of its own. Kept
 * out of search results until profiles render on the server with
 * per-startup metadata (`generateMetadata`); then they can be indexed and
 * listed in sitemap.ts.
 */
export const metadata: Metadata = { robots: NO_INDEX };

export default function StartupProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
