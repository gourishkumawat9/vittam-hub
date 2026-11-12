import { OG_SIZE, renderOgCard } from "@/lib/og-card";

export const runtime = "edge";
export const alt = "VittamHub: Visibility for Tomorrow's Unicorns";
export const size = OG_SIZE;
export const contentType = "image/png";

/**
 * Generated at request time (edge runtime) via Satori, not a static asset —
 * keeps the social preview in lockstep with the brand tokens instead of a
 * hand-exported PNG that silently drifts out of date.
 */
export default function OpengraphImage() {
  return renderOgCard();
}
