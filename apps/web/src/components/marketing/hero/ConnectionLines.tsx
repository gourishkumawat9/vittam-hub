"use client";

import { motion } from "framer-motion";

/** Decorative animated dashed curves behind the dashboard mockup, echoing the "network" theme. */
export function ConnectionLines() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-brand-primary/25"
      fill="none"
    >
      <motion.path
        d="M20 340 C 120 280, 140 160, 260 90"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 8"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      />
      <motion.path
        d="M380 60 C 300 120, 300 220, 370 320"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 8"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: "easeInOut", delay: 0.3 }}
      />
    </svg>
  );
}
