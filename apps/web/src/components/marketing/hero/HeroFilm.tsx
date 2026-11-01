"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { STORY_END } from "@/components/loader/constants";
import type { Player } from "@/components/loader/player";
import { cn } from "@/lib/utils";

import styles from "./HeroFilm.module.css";

const DESCRIPTION =
  "Founders push the Startups pillar toward Investors. A bridge of mentors, community and incubators joins them, a founder's idea becomes a startup, and startups cross the bridge, raise Seed, Series A and Series B, and take off as unicorns.";

const controlClass =
  "flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/80 text-text-secondary shadow-xs backdrop-blur transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary";

/**
 * The loading animation's story, played live on the landing page: it plays
 * once from the top when it comes into view, then holds the finished scene,
 * which carries on with a startup crossing the bridge every couple of
 * seconds. There's no end card, since the page has the logo already. It
 * pauses while scrolled away, has Pause and Replay buttons, and with reduced
 * motion or data saver shows a still of the live scene instead. The scene's
 * code loads after the page, so it adds nothing to its first load.
 */
export function HeroFilm({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<Player | null>(null);
  const finishedRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    let cancelled = false;
    Promise.all([import("@/components/loader/scene"), import("@/components/loader/player")])
      .then(([{ createScene }, { play }]) => {
        if (cancelled) return;
        const font = getComputedStyle(root).getPropertyValue("--font-heading").trim();
        const scene = createScene(canvas, { font: font ? `${font}, system-ui, sans-serif` : undefined, live: true });
        if (!scene) return;
        playerRef.current = play(root, canvas, scene, {
          time: (clock) => clock,
          onFrame: (clock) => {
            const done = clock >= STORY_END;
            if (done === finishedRef.current) return;
            finishedRef.current = done;
            setFinished(done);
          },
          onStill: (still) => setPlaying(!still),
        });
      })
      .catch(() => {
        // Offline: the frame stays empty but for its floor line.
      });
    return () => {
      cancelled = true;
      playerRef.current?.stop();
      playerRef.current = null;
    };
  }, []);

  const togglePause = () => {
    playerRef.current?.pause(!paused);
    setPaused(!paused);
  };

  const replay = () => {
    playerRef.current?.restart();
    finishedRef.current = false;
    setFinished(false);
    setPaused(false);
  };

  return (
    <div className={cn("relative", className)}>
      <div ref={rootRef} className={styles.root} role="img" aria-label={DESCRIPTION}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
      {playing && (
        // Top right, in the sky: lower down they'd cover the pillars' labels on phones.
        <div className="absolute right-3 top-3 flex gap-2">
          {finished && (
            <button
              type="button"
              onClick={replay}
              className={cn(controlClass, styles.appear)}
              aria-label="Replay the animation"
              title="Replay"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={togglePause}
            className={controlClass}
            aria-label={paused ? "Play the animation" : "Pause the animation"}
            title={paused ? "Play" : "Pause"}
          >
            {paused ? (
              <Play className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Pause className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
