import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The official icon-only mark (public/brand/vittamhub-icon.svg), with a white
 * silhouette (vittamhub-icon-white.svg) for dark/colored backgrounds — select
 * it with `variant="white"`. The SVGs are a faithful vector trace of the
 * official PNGs (kept alongside, and in brand/sources), made at the owner's
 * request so the mark stays sharp at any size. Never redrawn or recolored,
 * per CLAUDE.md §1.
 */
export function LogoMark({ className, variant = "color" }: { className?: string; variant?: "color" | "white" }) {
  const src = variant === "white" ? "/brand/vittamhub-icon-white.svg" : "/brand/vittamhub-icon.svg";
  return <Image src={src} alt="" width={96} height={96} unoptimized aria-hidden className={className} />;
}

export interface LogoProps {
  className?: string;
  /** Rendered height in pixels — width follows the source image's native aspect ratio (836×172) so it's never stretched or distorted. */
  height?: number;
}

/**
 * The official VittamHub logo (public/brand/vittamhub-logo.svg): the mark +
 * "VITTAMHUB" wordmark (no tagline), as a vector trace of the official PNG so
 * it stays sharp on every screen. Never redrawn, recolored, or cropped, per
 * CLAUDE.md §1. The icon-only variant is LogoMark above.
 */
export function Logo({ className, height = 32 }: LogoProps) {
  const width = Math.round((height * 836) / 172);
  return (
    <Image
      src="/brand/vittamhub-logo.svg"
      alt="VittamHub"
      width={width}
      height={height}
      unoptimized
      priority
      className={cn("h-auto w-auto", className)}
      style={{ height, width: "auto" }}
    />
  );
}
