import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The official icon-only mark (public/brand/vittamhub-icon.png). Because it's a
 * fixed-color raster it can't be recolored via CSS, so a pre-rendered white
 * silhouette (vittamhub-icon-white.png) is provided for dark/colored
 * backgrounds — select it with `variant="white"`. Used exactly as provided,
 * never redrawn or recolored, per CLAUDE.md §1.
 */
export function LogoMark({ className, variant = "color" }: { className?: string; variant?: "color" | "white" }) {
  const src = variant === "white" ? "/brand/vittamhub-icon-white.png" : "/brand/vittamhub-icon.png";
  return <Image src={src} alt="" width={96} height={96} aria-hidden className={className} />;
}

export interface LogoProps {
  className?: string;
  /** Rendered height in pixels — width follows the source image's native aspect ratio (836×172) so it's never stretched or distorted. */
  height?: number;
}

/**
 * The official VittamHub logo (public/brand/vittamhub-logo.png) — used
 * exactly as provided, never redrawn, recolored, or cropped, per CLAUDE.md §1.
 * Transparent-background raster of the mark + "VITTAMHUB" wordmark (no
 * tagline), so it sits cleanly on any surface. The icon-only variant lives at
 * public/brand/vittamhub-icon.png (and drives the favicon/app icon); the
 * white-tintable mark used on colored backgrounds is still LogoMark above.
 */
export function Logo({ className, height = 32 }: LogoProps) {
  const width = Math.round((height * 836) / 172);
  return (
    <Image
      src="/brand/vittamhub-logo.png"
      alt="VittamHub"
      width={width}
      height={height}
      priority
      className={cn("h-auto w-auto", className)}
      style={{ height, width: "auto" }}
    />
  );
}
