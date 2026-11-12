"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { ProductShot, type ProductShotImage } from "./ProductShot";
import { GradientOrbs } from "./hero/GradientOrbs";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

/**
 * The hero for every page below the home page (audience pages, About,
 * Pricing), in the home hero's language: a soft blue wash with the faint
 * grid and floating light, the eyebrow pill, one big line, and an optional
 * product screen on the right that floats in.
 */
export function PageHero({
  eyebrow,
  title,
  intro,
  actions,
  image,
  className,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  actions?: ReactNode;
  image?: ProductShotImage;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden border-b border-border bg-gradient-to-b from-brand-50 to-background dark:from-background-secondary",
        className,
      )}
    >
      <GradientOrbs />
      <div
        aria-hidden="true"
        className="bg-grid-pattern pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]"
      />
      <div className={cn("mx-auto grid max-w-content items-center gap-12 px-6 pb-16 pt-14 lg:pb-24 lg:pt-20", image && "lg:grid-cols-2")}>
        <div className="flex max-w-2xl flex-col items-start gap-6">
          <motion.p
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ duration: 0.4 }}
            className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-primary shadow-xs"
          >
            {eyebrow}
          </motion.p>
          <motion.h1
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="font-heading text-4xl font-bold tracking-tight text-text-primary sm:text-5xl"
          >
            {title}
          </motion.h1>
          {intro && (
            <motion.p
              initial={fadeUp.initial}
              animate={fadeUp.animate}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="text-lg text-text-secondary"
            >
              {intro}
            </motion.p>
          )}
          {actions && (
            <motion.div
              initial={fadeUp.initial}
              animate={fadeUp.animate}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
            >
              {actions}
            </motion.div>
          )}
        </div>

        {image && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="animate-float">
              <ProductShot image={image} priority sizes="(min-width: 1024px) 50vw, 100vw" />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
