import { renderOgCard } from "@/lib/og-card";

export const runtime = "edge";
export const alt = "VittamHub: Visibility for Tomorrow's Unicorns";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Twitter needs its own file even when identical to opengraph-image.tsx — Next.js does not fall back automatically. */
export default function TwitterImage() {
  return renderOgCard();
}
