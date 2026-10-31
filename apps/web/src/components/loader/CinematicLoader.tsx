"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

import styles from "./CinematicLoader.module.css";
import { CYCLE } from "./constants";

const LOGO_SRC = "/brand/vittamhub-logo.png";
/** Shown under the logo. The site-wide tagline is still "Visibility for Tomorrow's Unicorns". */
const LOADER_TAGLINE = "Nurturing Future Unicorns";

export interface CinematicLoaderProps {
  className?: string;
  /** Line under the logo. */
  tagline?: string;
  /** Fade in only after this many milliseconds, so loads that finish quickly never flash the loader. */
  appearAfter?: number;
  /** "auto" switches to a 9:16 frame on portrait phone screens; "landscape" keeps 16:9, e.g. above a status message. */
  framing?: "auto" | "landscape";
}

/**
 * VittamHub's loading animation, a ten-second loop in the site's own colours:
 * founders push the Startups pillar to the Investors pillar, a bridge of
 * mentors, community and incubators joins them, the idea bubble of founders
 * who haven't joined yet is connected and pops into Startups, and startups
 * cross the bridge to Investors, which launches them as unicorns. Then the
 * logo and tagline come in as an end card, as live HTML timed by the scene.
 * See ./scene.ts for the story itself.
 *
 * The scene's code loads only when a loader mounts, so it adds nothing to the
 * pages' first load. Until then, or without a canvas, the loader is its
 * poster: the end card. With reduced motion, data saver or a 2G connection,
 * or on a device too slow to keep up, it holds the end card instead of
 * playing the story. Decorative only (aria-hidden): the screen using it says
 * what is loading.
 */
export function CinematicLoader({
  className,
  tagline = LOADER_TAGLINE,
  appearAfter,
  framing = "auto",
}: CinematicLoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    // The loop starts as the loader appears, so it's seen from the beginning.
    const appearsAt = performance.now() + (appearAfter ?? 0);
    let stop = () => {};
    let cancelled = false;
    Promise.all([import("./scene"), import("./player")])
      .then(([{ createScene }, { play }]) => {
        if (cancelled) return;
        const font = getComputedStyle(root).getPropertyValue("--font-heading").trim();
        const scene = createScene(canvas, { font: font ? `${font}, system-ui, sans-serif` : undefined });
        if (scene) stop = play(root, canvas, scene, { startAt: appearsAt, time: (clock) => clock % CYCLE }).stop;
      })
      .catch(() => {
        // Offline: keep the poster.
      });
    return () => {
      cancelled = true;
      stop();
    };
  }, [appearAfter]);

  return (
    <div
      ref={rootRef}
      className={cn(
        styles.root,
        framing === "auto" && styles.auto,
        appearAfter !== undefined && styles.delayed,
        className,
      )}
      style={appearAfter !== undefined ? ({ "--appear-after": `${appearAfter}ms` } as CSSProperties) : undefined}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.brand}>
        <div className={styles.logo}>
          {/* Unoptimized so it's the same cached file the offline page uses, with no trip through the image optimizer. */}
          <Image src={LOGO_SRC} alt="" width={836} height={172} unoptimized priority className={styles.logoImage} />
          <span
            className={styles.glint}
            style={{ maskImage: `url(${LOGO_SRC})`, WebkitMaskImage: `url(${LOGO_SRC})` }}
          />
        </div>
        <p className={styles.tagline}>{tagline}</p>
      </div>
    </div>
  );
}
