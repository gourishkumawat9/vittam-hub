"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

import styles from "./CinematicLoader.module.css";
import { CYCLE } from "./constants";
import type { Scene } from "./scene";

const LOGO_SRC = "/brand/vittamhub-logo.png";
/** Shown under the logo. The site-wide tagline is still "Visibility for Tomorrow's Unicorns". */
const LOADER_TAGLINE = "Nurturing Future Unicorns";
/** Device-pixel ratios tried in turn when frames come too slowly; after the last, the loader holds a still. */
const SHARPNESS = [2, 1.5, 1];
/** If the median gap between frames is longer than this, drop a sharpness step. */
const SLOW_FRAME_MS = 40;

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
 * VittamHub's loading animation, a five-second loop in the site's own colours:
 * founders push the Startups pillar to the Investors pillar, a bridge of
 * mentors, community and incubators joins them, the idea bubble of founders
 * who haven't joined yet pops into Startups, and startups cross the bridge
 * to Investors, which launches them as unicorns. The logo and tagline stay
 * underneath as live HTML. See ./scene.ts for the story itself.
 *
 * The scene's code loads only when a loader mounts, so it adds nothing to the
 * pages' first load. Until then, or without a canvas, the loader is its
 * poster: the logo and tagline. With reduced motion, data saver or a 2G
 * connection, or on a device too slow to keep up, it shows a still of the
 * story instead of playing it. Decorative only (aria-hidden): the screen
 * using it says what is loading.
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
    import("./scene")
      .then(({ createScene }) => {
        if (cancelled) return;
        const font = getComputedStyle(root).getPropertyValue("--font-heading").trim();
        const scene = createScene(canvas, font ? `${font}, system-ui, sans-serif` : undefined);
        if (scene) stop = play(root, canvas, scene, appearsAt);
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

/** True when the connection asks for less data: data saver on, or 2G. */
function savingData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  return Boolean(connection?.saveData) || /(^|-)2g$/.test(connection?.effectiveType ?? "");
}

/** Whether the page behind the loader is dark, from the theme's background colour. */
function isDark(root: HTMLElement): boolean {
  const [r = 255, g = 255, b = 255] = getComputedStyle(root)
    .getPropertyValue("--color-background")
    .trim()
    .split(/\s+/)
    .map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}

/** Plays `scene` in the loader at `root`. Returns a function that stops it. */
function play(root: HTMLDivElement, canvas: HTMLCanvasElement, scene: Scene, appearsAt: number): () => void {
  // If the scene's code arrived late, start from the beginning now rather than mid-loop.
  const startAt = Math.max(appearsAt, performance.now());
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const darkScheme = window.matchMedia("(prefers-color-scheme: dark)");
  let sharpness = 0;
  let frame = 0;
  let last = 0;
  let gaps: number[] = [];
  let tooSlow = false;

  const still = () => motion.matches || tooSlow || savingData();
  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, SHARPNESS[sharpness] ?? 1);
    canvas.width = Math.max(1, Math.round(Math.min(root.clientWidth * ratio, 2048)));
    canvas.height = Math.max(1, Math.round(Math.min(root.clientHeight * ratio, 2048)));
  };
  const paint = (t: number | "still") => {
    const { glint } = scene.draw(t);
    root.style.setProperty("--glint", glint.toFixed(3));
    root.dataset.scene = "on";
  };
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    if (last) {
      gaps.push(now - last);
      if (gaps.length === 20) {
        const median = [...gaps].sort((a, b) => a - b)[10] ?? 0;
        gaps = [];
        if (median > SLOW_FRAME_MS) {
          if (sharpness === SHARPNESS.length - 1) {
            tooSlow = true;
            return run();
          }
          sharpness += 1;
          resize();
        }
      }
    }
    last = now;
    paint((Math.max(0, now - startAt) / 1000) % CYCLE);
  };
  const run = () => {
    cancelAnimationFrame(frame);
    last = 0;
    gaps = [];
    if (still()) paint("still");
    else if (!document.hidden) frame = requestAnimationFrame(tick);
  };
  const retheme = () => {
    scene.theme(isDark(root));
    if (still()) paint("still");
  };
  const observer = new ResizeObserver(() => {
    resize();
    if (still()) paint("still");
  });
  const themeObserver = new MutationObserver(retheme);

  scene.theme(isDark(root));
  resize();
  run();
  observer.observe(root);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  darkScheme.addEventListener("change", retheme);
  motion.addEventListener("change", run);
  document.addEventListener("visibilitychange", run);
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    themeObserver.disconnect();
    darkScheme.removeEventListener("change", retheme);
    motion.removeEventListener("change", run);
    document.removeEventListener("visibilitychange", run);
  };
}
