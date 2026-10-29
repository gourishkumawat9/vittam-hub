"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

import styles from "./CinematicLoader.module.css";
import { CYCLE, STILL_TIME, createScene, type Overlay } from "./scene";

const LOGO_SRC = "/brand/vittamhub-logo.png";
/** Shown under the logo at the end of each loop. The site-wide tagline is still "Visibility for Tomorrow's Unicorns". */
const LOADER_TAGLINE = "Nurturing Future Unicorns";
/** Canvas resolution per quality step. If frames run slow, the loader drops a step; the last also skips reflections and grain. */
const QUALITY = [1, 0.75, 0.6];
const SLOW_FRAME_MS = 24;

export interface CinematicLoaderProps {
  className?: string;
  /** Line under the logo once the story ends. */
  tagline?: string;
  /** Fade in only after this many milliseconds, so loads that finish quickly never flash the loader. */
  appearAfter?: number;
}

/**
 * VittamHub's loading animation: founders push the Startup pillar to the
 * Investors pillar, a bridge of mentors, community and incubators forms, the
 * idea bubble bursts into the Startup pillar, and the Investors pillar turns
 * into unicorns of light that become the official logo. It's drawn live on a
 * canvas (see ./scene.ts), loops every 12 seconds and pauses in hidden tabs.
 *
 * Before JavaScript runs, and with reduced motion, it shows a still of the
 * logo and tagline over the night sky. Decorative only (aria-hidden): the
 * screen using it says what is loading.
 */
export function CinematicLoader({ className, tagline = LOADER_TAGLINE, appearAfter }: CinematicLoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    let scene: ReturnType<typeof createScene>;
    try {
      const font = getComputedStyle(root).getPropertyValue("--font-heading").trim();
      scene = createScene(canvas, font ? `${font}, system-ui, sans-serif` : undefined);
    } catch {
      return; // No 2D canvas: keep the still poster.
    }
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const started = performance.now();
    let quality = 0;
    let frame = 0;
    let last = 0;
    let gaps: number[] = [];

    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 1.5) * (QUALITY[quality] ?? 1);
      canvas.width = Math.round(Math.min(root.clientWidth * scale, 1280));
      canvas.height = Math.round((canvas.width * 9) / 16);
    };
    const show = (o: Overlay) => {
      root.style.setProperty("--logo", o.logo.toFixed(3));
      root.style.setProperty("--logo-scale", o.logoScale.toFixed(3));
      root.style.setProperty("--glint", o.glint > 0 && o.glint < 1 ? o.glint.toFixed(3) : "-1");
      root.style.setProperty("--tagline", o.tagline.toFixed(3));
    };
    const paint = (t: number) => show(scene.draw(t, quality === QUALITY.length - 1));
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (last) gaps.push(now - last);
      last = now;
      if (gaps.length === 45) {
        const median = [...gaps].sort((x, y) => x - y)[22] ?? 0;
        if (median > SLOW_FRAME_MS && quality < QUALITY.length - 1) {
          quality += 1;
          resize();
        }
        gaps = [];
      }
      paint(((now - started) / 1000) % CYCLE);
    };
    const run = () => {
      cancelAnimationFrame(frame);
      last = 0;
      gaps = [];
      if (motion.matches) paint(STILL_TIME);
      else if (!document.hidden) frame = requestAnimationFrame(tick);
    };
    const observer = new ResizeObserver(() => {
      resize();
      if (motion.matches) paint(STILL_TIME);
    });

    resize();
    run();
    observer.observe(root);
    motion.addEventListener("change", run);
    document.addEventListener("visibilitychange", run);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      motion.removeEventListener("change", run);
      document.removeEventListener("visibilitychange", run);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn(styles.root, appearAfter !== undefined && styles.delayed, className)}
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
