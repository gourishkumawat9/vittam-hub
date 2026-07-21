"use client";

import { motion } from "framer-motion";
import { Handshake, Rocket, ShieldCheck, TrendingUp } from "lucide-react";

import { LogoMark } from "@/components/Logo";

/** Left-panel illustration: startups and investors connecting through a verified hub — pure token-driven SVG/CSS, no stock imagery. */
export function AuthIllustration() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-slate-900 p-10 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary/25 via-transparent to-transparent"
      />
      <div
        aria-hidden="true"
        className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black,transparent)]"
      />

      <div className="relative z-10 flex items-center gap-2">
        <LogoMark variant="white" className="h-8 w-8" />
        <span className="font-brand text-lg font-bold">VittamHub</span>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center py-12">
        <div className="relative flex items-center gap-10">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-3"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur">
              <Rocket className="h-7 w-7" />
            </span>
            <span className="text-sm font-medium text-slate-300">Startups</span>
          </motion.div>

          <svg aria-hidden="true" width="80" height="24" viewBox="0 0 80 24" fill="none" className="text-brand-secondary">
            <motion.path
              d="M2 12 H78"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, repeat: Infinity, repeatType: "loop", repeatDelay: 1 }}
            />
          </svg>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col items-center gap-3"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-brand-secondary bg-white/10 backdrop-blur">
              <ShieldCheck className="h-8 w-8 text-brand-secondary" />
            </span>
            <span className="text-sm font-medium text-slate-300">Verified Hub</span>
          </motion.div>

          <svg aria-hidden="true" width="80" height="24" viewBox="0 0 80 24" fill="none" className="text-brand-secondary">
            <motion.path
              d="M2 12 H78"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, repeat: Infinity, repeatType: "loop", repeatDelay: 1, delay: 0.3 }}
            />
          </svg>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center gap-3"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur">
              <Handshake className="h-7 w-7" />
            </span>
            <span className="text-sm font-medium text-slate-300">Investors</span>
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-brand-secondary">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Visibility for tomorrow&apos;s unicorns</span>
        </div>
        <p className="max-w-sm text-sm text-slate-300">
          One verified digital identity connects your startup to the investors, mentors, and partners who can move it forward.
        </p>
      </div>
    </div>
  );
}
