import { renderOgCard } from "@/lib/og-card";

export const runtime = "edge";
export const alt = "VittamHub: Visibility for Tomorrow's Unicorns";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Link-preview image for every page that doesn't define its own. */
export default function OpengraphImage() {
  return renderOgCard();
}
