import type { MetadataRoute } from "next";

import { HOME_TITLE, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

/** Web app manifest: name and official icon for "Add to home screen" and browsers that read it. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: HOME_TITLE,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#FFFFFF",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
