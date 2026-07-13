"use client";

import { motion } from "framer-motion";
import { Handshake, ShieldCheck } from "lucide-react";

const floatAnimation = {
  animate: { y: [0, -10, 0] },
  transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const },
};

/** Small "notification" cards orbiting the dashboard mockup — purely decorative, so hidden from assistive tech. */
export function FloatingCards() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
        transition={{ opacity: { duration: 0.5, delay: 0.8 }, x: { duration: 0.5, delay: 0.8 }, y: floatAnimation.transition }}
        className="absolute -left-6 top-8 hidden items-center gap-2 rounded-card border border-border bg-surface px-3.5 py-2.5 shadow-lg sm:flex"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-50">
          <ShieldCheck className="h-4 w-4 text-success-600" />
        </span>
        <div>
          <p className="text-xs font-semibold text-text-primary">Profile verified</p>
          <p className="text-[11px] text-text-secondary">2 min ago</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
        transition={{
          opacity: { duration: 0.5, delay: 1.1 },
          x: { duration: 0.5, delay: 1.1 },
          y: { ...floatAnimation.transition, delay: 0.7 },
        }}
        className="absolute -right-4 bottom-16 hidden items-center gap-2 rounded-card border border-border bg-surface px-3.5 py-2.5 shadow-lg sm:flex"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100">
          <Handshake className="h-4 w-4 text-brand-700" />
        </span>
        <div>
          <p className="text-xs font-semibold text-text-primary">New investor match</p>
          <p className="text-[11px] text-text-secondary">Northlight Ventures</p>
        </div>
      </motion.div>
    </div>
  );
}
