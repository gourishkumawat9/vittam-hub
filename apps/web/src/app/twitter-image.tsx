import { OG_SIZE, renderOgCard } from "@/lib/og-card";

export const runtime = "edge";
export const alt = "VittamHub: Visibility for Tomorrow's Unicorns";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Twitter requires its own file even when identical to opengraph-image.tsx — Next.js does not fall back automatically. */
export default function TwitterImage() {
  return renderOgCard();
}
