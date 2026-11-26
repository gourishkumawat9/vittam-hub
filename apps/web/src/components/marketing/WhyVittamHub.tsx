"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Pause, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { PLATFORM_FEATURES, type PlatformFeature } from "@/data/features";
import { cn } from "@/lib/utils";

import { ProductShot } from "./ProductShot";
import { SectionHeading } from "./SectionHeading";

/** How long each feature stays on screen before the tour moves on by itself. */
const STEP_MS = 7000;

/** True on screens wide enough for the side-by-side tour, where it plays by itself. */
function useWideScreen() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return wide;
}

/**
 * The real screen for one feature, rising from the bottom of a light blue
 * panel, the way product sites show their app. Browser screens run off the
 * bottom edge only, so the frame's "Demo data" tag always stays in view; the
 * phone screen is shown whole.
 */
function FeatureScreen({ feature, placement }: { feature: PlatformFeature; placement: "inline" | "side" }) {
  const isPhone = feature.image.device === "phone";
  // The phone is shown whole, so its "Demo data" tag underneath stays in view.
  const height = placement === "side" ? "h-[540px]" : isPhone ? "h-[29rem]" : "h-64 sm:h-96";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border border-border bg-gradient-to-br from-brand-50 via-brand-50 to-brand-100 dark:from-background-secondary dark:via-background-secondary dark:to-brand-950",
        height,
        placement === "inline" && "lg:hidden",
      )}
    >
      <div aria-hidden="true" className="bg-grid-pattern absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_80%_70%_at_30%_0%,black,transparent)]" />
      <AnimatePresence initial={false}>
        <motion.div
          key={feature.id}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10, transition: { duration: 0.25, ease: "easeIn" } }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={cn("absolute top-8 sm:top-10", isPhone ? "inset-x-0" : "inset-x-5 sm:inset-x-10")}
        >
          <ProductShot image={feature.image} sizes={isPhone ? "290px" : "(min-width: 1024px) 50vw, 100vw"} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * What you can do today, as a product tour: pick a feature on the left and
 * its real screen (a demo account) shows on the right. On wide screens it
 * steps through the four by itself, with a bar showing when it moves on,
 * until the visitor picks one. Phones get the same list, each opening onto
 * its screen, and never move by themselves.
 */
export function WhyVittamHub() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [paused, setPaused] = useState(false);
  const tourRef = useRef<HTMLDivElement>(null);
  const inView = useInView(tourRef, { amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const wide = useWideScreen();
  const playing = autoplay && wide && inView && !paused && !reduceMotion;

  const active = PLATFORM_FEATURES[activeIndex]!;
  const next = () => setActiveIndex((index) => (index + 1) % PLATFORM_FEATURES.length);

  return (
    <section id="features" className="mx-auto max-w-content scroll-mt-20 px-6 py-24">
      <SectionHeading
        eyebrow="Why VittamHub"
        title="What you can do today"
        description="Built for founders first: a profile investors can read in a minute, investors you reach with context, mentors to learn from, and a community of founders at your stage."
      />

      <div
        ref={tourRef}
        className="mt-14 grid items-start gap-8 lg:grid-cols-12 lg:gap-12"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        // Moving content stops while anything in it has keyboard focus (a mouse click doesn't count).
        onFocus={(event) => event.target.matches(":focus-visible") && setPaused(true)}
        onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setPaused(false)}
      >
        <div className="flex flex-col gap-3 lg:col-span-5">
          <ul className="flex flex-col gap-3">
            {PLATFORM_FEATURES.map((feature, index) => {
              const isActive = index === activeIndex;
              return (
                <li
                  key={feature.id}
                  className={cn(
                    "relative overflow-hidden rounded-card border transition-[background-color,border-color,box-shadow] duration-300",
                    isActive ? "border-border bg-surface shadow-md" : "border-transparent hover:bg-surface/70",
                  )}
                >
                  <button
                    type="button"
                    aria-expanded={isActive}
                    aria-controls={`feature-${feature.id}`}
                    onClick={() => {
                      setActiveIndex(index);
                      setAutoplay(false);
                    }}
                    className="flex w-full items-start gap-4 rounded-card p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                        isActive ? "bg-brand-primary text-white" : "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200",
                      )}
                    >
                      <feature.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className={cn("font-heading text-lg font-semibold", isActive ? "text-text-primary" : "text-text-secondary")}>
                        {feature.title}
                      </span>
                      <span className="text-sm text-text-secondary">{feature.description}</span>
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        id={`feature-${feature.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-4 px-5 pb-5 sm:pl-[4.75rem]">
                          <ul className="flex flex-col gap-2">
                            {feature.points.map((point) => (
                              <li key={point} className="flex items-start gap-2.5 text-sm text-text-primary">
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
                                {point}
                              </li>
                            ))}
                          </ul>
                          <Link
                            href={feature.link.href}
                            className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline"
                          >
                            {feature.link.label}
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          {/* Phones and tablets see the screen right under the feature it belongs to. */}
                          <FeatureScreen feature={feature} placement="inline" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isActive && autoplay && wide && !reduceMotion && (
                    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-border/60">
                      <motion.div
                        key={`${feature.id}-${playing}`}
                        className="h-full origin-left bg-brand-primary"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: playing ? 1 : 0 }}
                        transition={{ duration: playing ? STEP_MS / 1000 : 0, ease: "linear" }}
                        onAnimationComplete={() => playing && next()}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {wide && !reduceMotion && (
            <button
              type="button"
              onClick={() => setAutoplay((value) => !value)}
              className="ml-5 hidden w-fit items-center gap-2 rounded-button px-2 py-1 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary lg:inline-flex"
            >
              {autoplay ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
              {autoplay ? "Pause the tour" : "Play the tour"}
            </button>
          )}
        </div>

        <div className="sticky top-24 hidden lg:col-span-7 lg:block">
          <FeatureScreen feature={active} placement="side" />
        </div>
      </div>
    </section>
  );
}
