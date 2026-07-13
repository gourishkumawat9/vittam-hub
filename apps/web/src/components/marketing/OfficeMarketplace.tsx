"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";

import { OFFICE_TYPES } from "@/data/office-marketplace";

import { SectionHeading } from "./SectionHeading";

export function OfficeMarketplace() {
  return (
    <section className="border-t border-border bg-background-secondary">
      <div className="mx-auto max-w-content px-6 py-24">
        <SectionHeading eyebrow="Office Marketplace" title="Find your next workspace, anywhere you're building" />

        <form
          onSubmit={(event) => event.preventDefault()}
          className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-button border border-border bg-surface p-1.5 shadow-sm"
        >
          <Search className="ml-2.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
          <label htmlFor="office-city-search" className="sr-only">
            Search by city
          </label>
          <input
            id="office-city-search"
            type="text"
            placeholder="Search by city"
            className="w-full bg-transparent py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-button bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Search
          </button>
        </form>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {OFFICE_TYPES.map((office, index) => (
            <motion.div
              key={office.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ y: -4 }}
              className="flex flex-col items-center rounded-card border border-border bg-surface p-6 text-center shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
                <office.icon className="h-5 w-5 text-brand-700" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-heading text-sm font-semibold text-text-primary">{office.title}</h3>
              <p className="mt-1.5 text-xs text-text-secondary">{office.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
