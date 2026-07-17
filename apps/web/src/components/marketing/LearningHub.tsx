"use client";

import { Badge } from "@vittamhub/ui";
import { motion } from "framer-motion";

import { LEARNING_TRACKS } from "@/data/learning";

import { SectionHeading } from "./SectionHeading";

export function LearningHub() {
  return (
    <section id="learning" className="border-t border-border bg-background-secondary">
      <div className="mx-auto max-w-content px-6 py-24">
        <SectionHeading
          eyebrow="Learning Hub"
          title="Everything you need to build, taught by builders"
          description="Illustrative example tracks — content is coming soon, so lesson counts and progress aren't live yet."
          action={<Badge variant="neutral">Coming soon</Badge>}
        />

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LEARNING_TRACKS.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: (index % 4) * 0.07 }}
              whileHover={{ y: -4 }}
              className="flex flex-col rounded-card border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100">
                <track.icon className="h-5 w-5 text-brand-700" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-heading text-base font-semibold text-text-primary">{track.title}</h3>
              <p className="mt-2 flex-1 text-sm text-text-secondary">{track.description}</p>
              <p className="mt-3 text-xs text-text-secondary">{track.lessons} lessons</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background-secondary">
                <motion.div
                  className="h-full rounded-full bg-brand-primary"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${track.progress}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
