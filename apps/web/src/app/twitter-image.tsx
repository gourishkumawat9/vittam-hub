import { BRAND_CARD_ALT, BRAND_CARD_SIZE, renderBrandCard } from "@/lib/brand-card";

/** Same card as opengraph-image.tsx. Next.js needs its own file to emit the twitter:image tag. */
export const dynamic = "force-static";
export const alt = BRAND_CARD_ALT;
export const size = BRAND_CARD_SIZE;
export const contentType = "image/png";

export default function TwitterImage() {
  return renderBrandCard();
}
