"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { PLATFORM_FEATURES } from "@/data/features";

import { SectionHeading } from "./SectionHeading";

export function WhyVittamHub() {
  return (
    <section id="features" className="mx-auto max-w-content px-6 py-24">
      <SectionHeading
        eyebrow="Why VittamHub"
        title="Everything visibility requires"
        description="One ecosystem for identity, discovery, growth, and community — built for founders and investors who want transparency, not cold outreach."
      />

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORM_FEATURES.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: (index % 3) * 0.07 }}
            whileHover={{ y: -4 }}
            className="group flex flex-col rounded-card border border-border bg-surface p-6 shadow-sm transition-shadow duration-150 hover:shadow-lg"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 transition-transform duration-200 group-hover:scale-110">
              <feature.icon className="h-5 w-5 text-brand-700" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-heading text-base font-semibold text-text-primary">{feature.title}</h3>
            <p className="mt-2 flex-1 text-sm text-text-secondary">{feature.description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              Learn more
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
