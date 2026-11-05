import type { Scene } from "./scene";

/** Device-pixel ratios tried in turn when frames come too slowly; after the last, the player holds the still. */
const SHARPNESS = [2, 1.5, 1];
/** If the median gap between frames is longer than this, drop a sharpness step. */
const SLOW_FRAME_MS = 40;
/** Share of the frame that has to be in view for it to play. */
const ON_SCREEN = 0.4;

export interface PlayOptions {
  /** `performance.now()` at which the clock starts from 0. Defaults to now. */
  startAt?: number;
  /** The scene time to draw `clock` seconds into playing. */
  time(clock: number): number;
  /** Called after each frame it draws while playing, with the clock. */
  onFrame?(clock: number): void;
  /** Called with true when it holds the scene's still instead of playing, and false when it plays. */
  onStill?(still: boolean): void;
}

export interface Player {
  /** Pauses on the current frame, or carries on from it. */
  pause(paused: boolean): void;
  /** Plays again from the start. */
  restart(): void;
  /** Stops for good. */
  stop(): void;
}

/** True when the connection asks for less data: data saver on, or 2G. */
function savingData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  return Boolean(connection?.saveData) || /(^|-)2g$/.test(connection?.effectiveType ?? "");
}

/** Whether the page behind `root` is dark, from the theme's background colour. */
function isDark(root: HTMLElement): boolean {
  const [r = 255, g = 255, b = 255] = getComputedStyle(root)
    .getPropertyValue("--color-background")
    .trim()
    .split(/\s+/)
    .map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}

/**
 * Plays `scene` on `canvas`, which fills `root`. The clock only runs while
 * the scene is mostly on screen, the tab is visible and it isn't paused, so it
 * carries on where it left off. With reduced motion, data saver or a 2G
 * connection, or on a device too slow to keep up even at lower sharpness, it
 * holds the scene's still instead. It follows the light/dark theme, and sets
 * the scene's overlay on `root` as --logo-in, --tagline-in and --glint.
 */
export function play(root: HTMLElement, canvas: HTMLCanvasElement, scene: Scene, options: PlayOptions): Player {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const darkScheme = window.matchMedia("(prefers-color-scheme: dark)");
  // The clock reads now - zero, or `held` while it isn't running.
  let zero = Math.max(options.startAt ?? 0, performance.now());
  let held = -1;
  let paused = false;
  let onScreen = true;
  let sharpness = 0;
  let frame = 0;
  let last = 0;
  let gaps: number[] = [];
  let tooSlow = false;
  let wasStill: boolean | undefined;

  const seconds = (now: number) => (held >= 0 ? held : Math.max(0, now - zero)) / 1000;
  const still = () => motion.matches || tooSlow || savingData();
  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, SHARPNESS[sharpness] ?? 1);
    canvas.width = Math.max(1, Math.round(Math.min(root.clientWidth * ratio, 2048)));
    canvas.height = Math.max(1, Math.round(Math.min(root.clientHeight * ratio, 2048)));
  };
  const paint = (t: number | "still") => {
    const { logo, tagline, glint } = scene.draw(t);
    root.style.setProperty("--logo-in", logo.toFixed(3));
    root.style.setProperty("--tagline-in", tagline.toFixed(3));
    root.style.setProperty("--glint", glint.toFixed(3));
    root.dataset.scene = "on";
  };
  /** Draws the current frame again, e.g. after a resize cleared the canvas or the theme changed. */
  const redraw = () => paint(still() ? "still" : options.time(seconds(performance.now())));
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
            return update();
          }
          sharpness += 1;
          resize();
        }
      }
    }
    last = now;
    const clock = seconds(now);
    paint(options.time(clock));
    options.onFrame?.(clock);
  };
  /** Starts or stops the frames to match everything that decides whether it plays. */
  const update = () => {
    cancelAnimationFrame(frame);
    last = 0;
    gaps = [];
    const isStill = still();
    if (isStill !== wasStill) {
      wasStill = isStill;
      options.onStill?.(isStill);
    }
    if (isStill) return paint("still");
    const now = performance.now();
    if (!paused && onScreen && !document.hidden) {
      if (held >= 0) {
        zero = now - held;
        held = -1;
      }
      frame = requestAnimationFrame(tick);
    } else {
      if (held < 0) held = Math.max(0, now - zero);
      redraw();
    }
  };
  const retheme = () => {
    scene.theme(isDark(root));
    redraw();
  };
  const resizeObserver = new ResizeObserver(() => {
    resize();
    redraw();
  });
  // On screen means mostly in view, so a frame that loads half below the fold waits to be scrolled to.
  const screenObserver = new IntersectionObserver(
    ([entry]) => {
      const seen = Boolean(entry?.isIntersecting) && entry!.intersectionRatio >= ON_SCREEN - 0.01;
      if (seen === onScreen) return;
      onScreen = seen;
      update();
    },
    { threshold: [0, ON_SCREEN] },
  );
  const themeObserver = new MutationObserver(retheme);

  scene.theme(isDark(root));
  resize();
  update();
  resizeObserver.observe(root);
  screenObserver.observe(root);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  darkScheme.addEventListener("change", retheme);
  motion.addEventListener("change", update);
  document.addEventListener("visibilitychange", update);
  return {
    pause(value) {
      paused = value;
      update();
    },
    restart() {
      paused = false;
      zero = performance.now();
      held = held >= 0 ? 0 : -1;
      update();
    },
    stop() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      screenObserver.disconnect();
      themeObserver.disconnect();
      darkScheme.removeEventListener("change", retheme);
      motion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    },
  };
}
