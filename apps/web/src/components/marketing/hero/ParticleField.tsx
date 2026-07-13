"use client";

import { motion } from "framer-motion";

/**
 * Fixed (not Math.random()) positions — randomizing at render time would
 * mismatch between server and client output and trigger a hydration error.
 * `top`/`left` are percentages, `delay`/`duration` in seconds.
 */
const PARTICLES = [
  { top: 12, left: 8, size: 5, delay: 0, duration: 7 },
  { top: 22, left: 88, size: 4, delay: 0.6, duration: 8 },
  { top: 68, left: 5, size: 3, delay: 1.1, duration: 6.5 },
  { top: 78, left: 92, size: 5, delay: 0.3, duration: 7.5 },
  { top: 40, left: 15, size: 3, delay: 1.6, duration: 9 },
  { top: 55, left: 80, size: 4, delay: 0.9, duration: 6 },
  { top: 8, left: 45, size: 3, delay: 1.9, duration: 8.5 },
  { top: 88, left: 40, size: 4, delay: 0.4, duration: 7 },
  { top: 30, left: 65, size: 3, delay: 1.3, duration: 9.5 },
  { top: 62, left: 30, size: 3, delay: 0.7, duration: 6.8 },
] as const;

/** Soft floating dots behind the hero — purely decorative, hidden from assistive tech. */
export function ParticleField() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {PARTICLES.map((particle, index) => (
        <motion.span
          key={index}
          className="absolute rounded-full bg-brand-primary/25"
          style={{
            top: `${particle.top}%`,
            left: `${particle.left}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{ y: [0, -16, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
