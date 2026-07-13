import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Hand-drawn stand-in for the official mark, used only where an icon-only,
 * recolorable (currentColor) SVG is structurally required — e.g. tinted white
 * on a colored background (AuthIllustration, CtaSection) or as the center
 * node of a diagram (EcosystemDiagram). The official logo file
 * (public/brand/vittamhub-logo.jpg, used by <Logo> below) is a single flat
 * raster combining icon + wordmark, so it can't be cropped to an icon-only
 * asset or recolored without altering the provided file — see CLAUDE.md §1.
 * Swap this out once an official icon-only asset exists.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={cn("text-brand-primary", className)} aria-hidden="true">
      {/* Left pillar — flat-capped flanges tapering to the stem (dogbone/I-beam profile) */}
      <path
        d="M17 8H43V14L35 20V72L43 78V84H17V78L25 72V20L17 14Z"
        fill="currentColor"
      />
      {/* Right pillar */}
      <path
        d="M57 8H83V14L75 20V72L83 78V84H57V78L65 72V20L57 14Z"
        fill="currentColor"
      />
      {/* Crossbar — spans the full width, behind/through both pillars */}
      <rect x="10" y="44" width="80" height="6" fill="currentColor" />
      {/* V bridge, dipping from the crossbar into the gap between pillars */}
      <path
        d="M35 47L50 68L65 47"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
    </svg>
  );
}

export interface LogoProps {
  className?: string;
  /** Rendered height in pixels — width follows the source image's native aspect ratio (1600×628) so it's never stretched or distorted. */
  height?: number;
}

/**
 * The official VittamHub logo (public/brand/vittamhub-logo.jpg) — used
 * exactly as provided, never redrawn, recolored, or cropped, per CLAUDE.md §1.
 * It's a single flat-background raster combining icon + wordmark + tagline,
 * so there's no separate "icon only" or "on dark background" variant yet —
 * see the note on LogoMark above for where that gap still shows up.
 */
export function Logo({ className, height = 32 }: LogoProps) {
  const width = Math.round((height * 1600) / 628);
  return (
    <Image
      src="/brand/vittamhub-logo.jpg"
      alt="VittamHub — Visibility for Tomorrow's Unicorns"
      width={width}
      height={height}
      priority
      className={cn("h-auto w-auto", className)}
      style={{ height, width: "auto" }}
    />
  );
}
