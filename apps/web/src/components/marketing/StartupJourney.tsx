"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { JOURNEY_STAGES } from "@/data/journey";

import { SectionHeading } from "./SectionHeading";

export function StartupJourney() {
  const [activeId, setActiveId] = useState(JOURNEY_STAGES[0]!.id);

  return (
    <section id="journey" className="border-t border-border bg-background-secondary">
      <div className="mx-auto max-w-content px-6 py-24">
        <SectionHeading
          eyebrow="The journey"
          title="One platform, every stage"
          description="VittamHub grows with your startup — from first idea to the unicorn milestone. Select a stage to see how."
        />

        <div className="relative mx-auto mt-16 max-w-2xl">
          <div aria-hidden="true" className="absolute bottom-4 left-[15px] top-4 w-px bg-border" />

          <ol className="flex flex-col">
            {JOURNEY_STAGES.map((stage, index) => {
              const isActive = stage.id === activeId;
              return (
                <li key={stage.id} className="relative pl-10">
                  <button
                    type="button"
                    onClick={() => setActiveId(stage.id)}
                    onMouseEnter={() => setActiveId(stage.id)}
                    aria-expanded={isActive}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                        isActive
                          ? "border-brand-primary bg-brand-primary text-white"
                          : "border-border bg-surface text-text-secondary"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span
                      className={`font-heading text-base font-semibold transition-colors ${
                        isActive ? "text-brand-primary" : "text-text-primary"
                      }`}
                    >
                      {stage.label}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4 shadow-sm mb-4">
                          <p className="text-sm text-text-secondary">{stage.description}</p>
                          <p className="text-sm text-text-primary">
                            <span className="font-semibold text-brand-primary">How VittamHub helps: </span>
                            {stage.howVittamHelps}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
