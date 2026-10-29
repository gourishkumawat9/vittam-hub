"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

import styles from "./CinematicLoader.module.css";
import { CAPTIONS, CYCLE, STILL_TIME } from "./constants";
import type { Film, Overlay } from "./film";

const LOGO_SRC = "/brand/vittamhub-logo.png";
/** Shown under the logo at the end of each loop. The site-wide tagline is still "Visibility for Tomorrow's Unicorns". */
const LOADER_TAGLINE = "Nurturing Future Unicorns";
/** Render scale per quality step. From the third step the film also skips reflections and shadows. */
const QUALITY = [1, 0.8, 0.65, 0.5];
/** The film runs at 30 fps whatever the screen's rate: it reads as film and halves the GPU work. */
const FRAME_MS = 1000 / 30;
/** If the median gap between frames is longer than this, drop a quality step; after the last, hold a still. */
const SLOW_FRAME_MS = 45;
/** A single gap this long means the GPU is far behind: drop two steps at once. */
const STALL_MS = 250;

export interface CinematicLoaderProps {
  className?: string;
  /** Line under the logo once the story ends. */
  tagline?: string;
  /** Fade in only after this many milliseconds, so loads that finish quickly never flash the loader. */
  appearAfter?: number;
}

/**
 * VittamHub's loading film: in a storm, founders push the Startups monolith
 * to the Investors monolith while a bridge of incubators, community and
 * mentors forms; the idea bubble bursts and its startup people land on the
 * Startups pillar; the Investors pillar charges up and erupts into unicorns
 * of blue fire that become the official logo. It's rendered live with WebGL2
 * (see ./film.ts), loops every 12 seconds and pauses in hidden tabs.
 *
 * The film's code loads only when a loader mounts, so it adds nothing to the
 * pages' first load. Until it's loaded and its shader compiled, without
 * WebGL2, or on a device too slow to keep up, the loader shows a still of the
 * logo and tagline; with reduced motion, a still frame of the film.
 * Decorative only (aria-hidden): the screen using it says what is loading.
 */
export function CinematicLoader({ className, tagline = LOADER_TAGLINE, appearAfter }: CinematicLoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    let stop = () => {};
    let cancelled = false;
    import("./film")
      .then(({ createFilm }) => {
        if (cancelled) return;
        const font = getComputedStyle(root).getPropertyValue("--font-heading").trim();
        stop = play(root, canvas, createFilm(canvas, font ? `${font}, system-ui, sans-serif` : undefined));
      })
      .catch(() => {
        // Offline, or no WebGL2: keep the still poster.
      });
    return () => {
      cancelled = true;
      stop();
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
      {CAPTIONS.map((text) => (
        <span key={text} data-caption className={styles.caption}>
          {text}
        </span>
      ))}
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

/** Runs the film in the loader at `root`. Returns a function that stops it and frees the GPU. */
function play(root: HTMLDivElement, canvas: HTMLCanvasElement, film: Film): () => void {
  const captions = Array.from(root.querySelectorAll<HTMLElement>("[data-caption]"));
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let quality = 0;
  let frame = 0;
  let started = 0;
  let last = 0;
  let drawn = 0;
  let gaps: number[] = [];
  let still = false;

  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, 1.25) * (QUALITY[quality] ?? 0.5);
    canvas.width = Math.max(1, Math.round(Math.min(root.clientWidth * scale, 1280)));
    canvas.height = Math.max(1, Math.round((canvas.width * 9) / 16));
  };
  const show = (o: Overlay) => {
    root.style.setProperty("--logo", o.logo.toFixed(3));
    root.style.setProperty("--logo-scale", o.logoScale.toFixed(3));
    root.style.setProperty("--glint", o.glint > 0 && o.glint < 1 ? o.glint.toFixed(3) : "-1");
    root.style.setProperty("--tagline", o.tagline.toFixed(3));
    o.labels.forEach((label, i) => {
      const el = captions[i];
      if (!el) return;
      el.style.left = `${(label.x * 100).toFixed(2)}%`;
      el.style.top = `${(label.y * 100).toFixed(2)}%`;
      el.style.opacity = label.opacity.toFixed(3);
    });
  };
  const poster = () => {
    cancelAnimationFrame(frame);
    delete root.dataset.film;
    for (const name of ["--logo", "--logo-scale", "--glint", "--tagline"]) root.style.removeProperty(name);
    for (const el of captions) el.style.opacity = "0";
  };
  const paint = (t: number) => {
    show(film.draw(t, quality));
    root.dataset.film = "on";
  };
  const hold = () => {
    cancelAnimationFrame(frame);
    paint(STILL_TIME);
  };
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    const status = film.status();
    if (status === "pending") return;
    if (status === "failed") return poster();
    if (motion.matches || still) return hold();
    if (!started) started = now;
    if (last && now - last < FRAME_MS - 4) return;
    // The first frames include one-off GPU set-up, so they don't count.
    const gap = last && drawn > 1 ? now - last : 0;
    last = now;
    drawn += 1;
    if (gap) gaps.push(gap);
    const stalled = gap > STALL_MS;
    if (stalled || gaps.length === 12) {
      const median = [...gaps].sort((x, y) => x - y)[gaps.length >> 1] ?? 0;
      gaps = [];
      if (stalled || median > SLOW_FRAME_MS) {
        if (quality === QUALITY.length - 1) {
          still = true;
          return hold();
        }
        quality = Math.min(quality + (stalled ? 2 : 1), QUALITY.length - 1);
        resize();
      }
    }
    paint(((now - started) / 1000) % CYCLE);
  };
  const run = () => {
    cancelAnimationFrame(frame);
    last = 0;
    drawn = 0;
    gaps = [];
    if (!document.hidden) frame = requestAnimationFrame(tick);
  };
  const observer = new ResizeObserver(() => {
    resize();
    if ((motion.matches || still) && film.status() === "ready") paint(STILL_TIME);
  });
  const lost = (e: Event) => {
    e.preventDefault();
    poster();
  };

  resize();
  run();
  observer.observe(root);
  motion.addEventListener("change", run);
  document.addEventListener("visibilitychange", run);
  canvas.addEventListener("webglcontextlost", lost);
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    motion.removeEventListener("change", run);
    document.removeEventListener("visibilitychange", run);
    canvas.removeEventListener("webglcontextlost", lost);
    film.dispose();
  };
}
