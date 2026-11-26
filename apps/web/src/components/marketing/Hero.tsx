"use client";

import { motion, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { useParallax } from "@/hooks/useParallax";

import { GradientOrbs } from "./hero/GradientOrbs";
import { HeroFilm } from "./hero/HeroFilm";

/** True today, and the three things a founder weighs before signing up. */
const REASSURANCES = ["Free for founders", "Connect requests, not cold emails", "Set up in about five minutes"];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function Hero() {
  const { x, y } = useParallax();
  const parallaxX = useTransform(x, (value) => value * 24);
  const parallaxY = useTransform(y, (value) => value * 24);

  return (
    <section className="relative overflow-hidden">
      <GradientOrbs />
      <div
        aria-hidden="true"
        className="bg-grid-pattern pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]"
      />

      <div className="mx-auto grid max-w-content items-center gap-16 px-6 pb-16 pt-16 lg:grid-cols-2 lg:pb-20 lg:pt-24">
        {/* Left column — copy + CTAs */}
        <div className="flex flex-col items-center gap-7 text-center lg:items-start lg:text-left">
          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-2 lg:items-start"
          >
            <p className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-primary shadow-xs">
              Nurturing future startups
            </p>
            <p className="text-sm font-medium text-text-secondary">Visibility for tomorrow&apos;s unicorns</p>
          </motion.div>

          <motion.h1
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="max-w-xl font-heading text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]"
          >
            The digital identity for every startup.
          </motion.h1>

          <motion.p
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="max-w-lg text-lg text-text-secondary"
          >
            Build trust, showcase your journey, and connect with investors, mentors and other founders on one verified
            platform.
          </motion.p>

          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start"
          >
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-button bg-brand-primary px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Get started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {/* Was "Watch demo", which opened a box saying the video was coming soon. */}
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-button border border-border bg-surface px-6 py-3.5 text-sm font-semibold text-text-primary transition-colors hover:bg-background-secondary"
            >
              See how it works
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </motion.div>

          <motion.ul
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="flex flex-wrap justify-center gap-x-5 gap-y-2 lg:justify-start"
          >
            {REASSURANCES.map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-sm text-text-secondary">
                <Check className="h-4 w-4 text-success-600" aria-hidden="true" />
                {item}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Right column — the brand story, played live; edge to edge on phones */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative -mx-6 sm:mx-auto sm:w-full sm:max-w-xl lg:max-w-none"
          style={{ x: parallaxX, y: parallaxY }}
        >
          <HeroFilm />
        </motion.div>
      </div>

    </section>
  );
}
