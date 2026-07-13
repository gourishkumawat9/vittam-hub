"use client";

import { useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

/**
 * Tracks pointer position as a -0.5..0.5 range on each axis, spring-smoothed.
 * Multiply by a pixel amount per layer for a cheap mouse-parallax effect.
 * No-ops (stays centered) on touch devices where there's no hover pointer.
 */
export function useParallax() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 60, damping: 20, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 60, damping: 20, mass: 0.4 });

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const handleMove = (event: PointerEvent) => {
      x.set(event.clientX / window.innerWidth - 0.5);
      y.set(event.clientY / window.innerHeight - 0.5);
    };

    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [x, y]);

  return { x: springX, y: springY };
}
