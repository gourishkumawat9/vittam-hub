"use client";

import { useEffect, useRef } from "react";

import type { Player } from "@/components/loader/player";

import styles from "./HeroFilm.module.css";

const DESCRIPTION =
  "Founders push the Startups pillar toward Investors. A bridge of mentors, community and incubators joins them, a founder's idea becomes a startup, and startups cross the bridge, raise Seed, Series A and Series B, and take off as unicorns.";

/**
 * The loading animation's story, played live on the landing page and beside
 * the login and sign-up forms: it plays once from the top when it comes into
 * view, then holds the finished scene, which carries on with a startup
 * crossing the bridge every couple of seconds. There's no end card, since the
 * page has the logo already, and no Replay or Pause buttons (the owner asked
 * for none). It pauses while scrolled away or in a background tab, and with
 * reduced motion or data saver it shows a still of the live scene instead.
 * The scene's code loads after the page, so it adds nothing to its first load.
 */
export function HeroFilm({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    let cancelled = false;
    let player: Player | null = null;
    Promise.all([import("@/components/loader/scene"), import("@/components/loader/player")])
      .then(([{ createScene }, { play }]) => {
        if (cancelled) return;
        const font = getComputedStyle(root).getPropertyValue("--font-heading").trim();
        const scene = createScene(canvas, { font: font ? `${font}, system-ui, sans-serif` : undefined, live: true });
        if (!scene) return;
        player = play(root, canvas, scene, { time: (clock) => clock });
      })
      .catch(() => {
        // Offline: the frame stays empty but for its floor line.
      });
    return () => {
      cancelled = true;
      player?.stop();
    };
  }, []);

  return (
    <div className={className}>
      <div ref={rootRef} className={styles.root} role="img" aria-label={DESCRIPTION}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
    </div>
  );
}
