"use client";

import { motion } from "framer-motion";

/** One soft, near-static blurred color field behind the hero — ambient depth, not a moving background. */
export function GradientOrbs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-brand-primary/10 blur-3xl"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
