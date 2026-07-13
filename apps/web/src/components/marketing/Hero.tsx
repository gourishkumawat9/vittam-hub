"use client";

import { motion, useTransform } from "framer-motion";
import { ArrowRight, Compass, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CursorGlow } from "@/components/CursorGlow";
import { useParallax } from "@/hooks/useParallax";

import { ConnectionLines } from "./hero/ConnectionLines";
import { DashboardMockup } from "./hero/DashboardMockup";
import { DemoModal } from "./hero/DemoModal";
import { FloatingCards } from "./hero/FloatingCards";
import { GradientOrbs } from "./hero/GradientOrbs";
import { ParticleField } from "./hero/ParticleField";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function Hero() {
  const [demoOpen, setDemoOpen] = useState(false);
  const { x, y } = useParallax();
  const parallaxX = useTransform(x, (value) => value * 24);
  const parallaxY = useTransform(y, (value) => value * 24);

  return (
    <section className="relative overflow-hidden">
      <GradientOrbs />
      <div aria-hidden="true" className="bg-grid-pattern pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
      <ParticleField />

      <div className="mx-auto grid max-w-content items-center gap-16 px-6 pb-24 pt-16 lg:grid-cols-2 lg:pb-32 lg:pt-24">
        {/* Left column — copy + CTAs */}
        <div className="flex flex-col items-center gap-7 text-center lg:items-start lg:text-left">
          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-primary shadow-xs"
          >
            Visibility for tomorrow&apos;s unicorns
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
            Build trust, showcase your journey, and connect with investors, mentors, incubators, and strategic
            partners — all from one verified platform.
          </motion.p>

          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start"
          >
            <CursorGlow className="rounded-button">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-button bg-brand-primary px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CursorGlow>
            <Link
              href="#discover-startups"
              className="inline-flex items-center justify-center gap-2 rounded-button border border-border bg-surface px-6 py-3.5 text-sm font-semibold text-text-primary transition-colors hover:bg-background-secondary"
            >
              <Compass className="h-4 w-4" />
              Explore startups
            </Link>
            <button
              type="button"
              onClick={() => setDemoOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-button px-6 py-3.5 text-sm font-semibold text-text-primary transition-colors hover:bg-background-secondary"
            >
              <PlayCircle className="h-4 w-4" />
              Watch demo
            </button>
          </motion.div>
        </div>

        {/* Right column — interactive dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative mx-auto w-full max-w-md"
          style={{ x: parallaxX, y: parallaxY }}
        >
          <ConnectionLines />
          <DashboardMockup />
          <FloatingCards />
        </motion.div>
      </div>

      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </section>
  );
}
