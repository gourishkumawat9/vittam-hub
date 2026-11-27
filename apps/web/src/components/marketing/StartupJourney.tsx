"use client";

import { ArrowLeft, ArrowRight } from "@vittamhub/ui/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { PLATFORM_FEATURES } from "@/data/features";
import { JOURNEY_STAGES, type JourneyStage } from "@/data/journey";
import { cn } from "@/lib/utils";

import { SectionHeading } from "./SectionHeading";

const FEATURE_BY_ID = new Map(PLATFORM_FEATURES.map((feature) => [feature.id, feature]));

/** The parts of VittamHub that matter most at a stage, as small labelled chips. */
function UsesChips({ stage }: { stage: JourneyStage }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {stage.uses.map((id) => {
        const feature = FEATURE_BY_ID.get(id);
        if (!feature) return null;
        return (
          <li
            key={id}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-200"
          >
            <feature.icon className="h-3.5 w-3.5" aria-hidden="true" />
            {feature.title}
          </li>
        );
      })}
    </ul>
  );
}

/** The open stage in full, beside the list on wide screens. */
function StageDetail({ stage, index, onStep }: { stage: JourneyStage; index: number; onStep: (index: number) => void }) {
  const total = JOURNEY_STAGES.length;
  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-surface p-8 shadow-lg lg:p-10">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-300 via-brand-primary to-brand-700" />

      {/* Where this stage sits on the road from idea to unicorn. */}
      <div aria-hidden="true" className="flex items-center gap-1.5">
        {JOURNEY_STAGES.map((item, position) => (
          <span
            key={item.id}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              position <= index ? "bg-brand-primary" : "bg-border",
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={stage.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <span className="font-numeric text-xs font-semibold uppercase tracking-wider text-brand-primary">
              Stage {index + 1} of {total}
            </span>
            <h3 className="font-heading text-3xl font-bold tracking-tight text-text-primary">{stage.label}</h3>
            <p className="text-text-secondary">{stage.description}</p>
          </div>

          <div className="rounded-button bg-background-secondary p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">How VittamHub helps</p>
            <p className="mt-2 text-base text-text-primary">{stage.howVittamHelps}</p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">What you&apos;ll use most</p>
            <UsesChips stage={stage} />
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
        <button
          type="button"
          onClick={() => onStep(index - 1)}
          disabled={index === 0}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary disabled:pointer-events-none disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {index > 0 ? JOURNEY_STAGES[index - 1]!.label : "Previous"}
        </button>
        <button
          type="button"
          onClick={() => onStep(index + 1)}
          disabled={index === total - 1}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary transition-colors hover:text-brand-700 disabled:pointer-events-none disabled:opacity-40"
        >
          {index < total - 1 ? JOURNEY_STAGES[index + 1]!.label : "Next"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/**
 * Idea to unicorn, one stage at a time. Wide screens list the stages on the
 * left and show the open one in full on the right; phones open each stage in
 * place.
 */
export function StartupJourney() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = JOURNEY_STAGES[activeIndex]!;
  const step = (index: number) => setActiveIndex(Math.min(Math.max(index, 0), JOURNEY_STAGES.length - 1));

  return (
    <section id="journey" className="border-t border-border bg-background-secondary">
      <div className="mx-auto max-w-content px-6 py-24">
        <SectionHeading
          eyebrow="The journey"
          title="One platform, every stage"
          description="VittamHub grows with your startup, from first idea to the unicorn milestone. Pick a stage to see how."
        />

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="relative lg:col-span-5">
            <div aria-hidden="true" className="absolute bottom-5 left-[15px] top-5 w-px bg-border" />

            <ol className="flex flex-col">
              {JOURNEY_STAGES.map((stage, index) => {
                const isActive = index === activeIndex;
                const isPast = index < activeIndex;
                return (
                  <li key={stage.id} className="relative pl-12">
                    <button
                      type="button"
                      onClick={() => step(index)}
                      aria-expanded={isActive}
                      aria-current={isActive ? "step" : undefined}
                      className={cn(
                        "group flex w-full items-center justify-between gap-3 rounded-button py-3 pr-3 text-left transition-colors lg:px-3",
                        isActive ? "lg:bg-surface lg:shadow-sm" : "hover:lg:bg-surface/60",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute left-0 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-numeric text-xs font-bold transition-colors duration-300",
                          isActive
                            ? "border-brand-primary bg-brand-primary text-white shadow-md"
                            : isPast
                              ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-950 dark:text-brand-200"
                              : "border-border bg-surface text-text-secondary",
                        )}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={cn(
                          "font-heading text-base font-semibold transition-colors",
                          isActive ? "text-brand-primary" : "text-text-primary group-hover:text-brand-primary",
                        )}
                      >
                        {stage.label}
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className={cn(
                          "hidden h-4 w-4 transition-all duration-200 lg:block",
                          isActive ? "translate-x-0 text-brand-primary opacity-100" : "-translate-x-1 opacity-0",
                        )}
                      />
                    </button>

                    {/* Phones and tablets open the stage right here. */}
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden lg:hidden"
                        >
                          <div className="mb-4 flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-sm">
                            <p className="text-sm text-text-secondary">{stage.description}</p>
                            <p className="text-sm text-text-primary">
                              <span className="font-semibold text-brand-primary">How VittamHub helps: </span>
                              {stage.howVittamHelps}
                            </p>
                            <UsesChips stage={stage} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="sticky top-24 hidden lg:col-span-7 lg:block">
            <StageDetail stage={active} index={activeIndex} onStep={step} />
          </div>
        </div>
      </div>
    </section>
  );
}
