"use client";

import { Badge } from "@vittamhub/ui";
import { motion } from "framer-motion";

import { FEATURED_INVESTORS } from "@/data/investors";

import { SectionHeading } from "./SectionHeading";

export function FeaturedInvestors() {
  return (
    <section id="investors" className="border-t border-border bg-background-secondary">
      <div className="mx-auto max-w-content px-6 py-24">
        <SectionHeading
          eyebrow="How discovery works"
          title="Find investors by ticket size, industry, and stage"
          description="Illustrative example profiles — VittamHub is in early access and these are not real investors or firms."
          action={<Badge variant="neutral">Example profiles</Badge>}
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_INVESTORS.map((investor, index) => (
            <motion.div
              key={investor.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ y: -4 }}
              className="flex flex-col rounded-card border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 font-heading text-sm font-bold text-brand-700">
                  {investor.initials}
                </div>
                <div>
                  <h3 className="font-heading text-sm font-semibold text-text-primary">{investor.name}</h3>
                  <p className="text-xs text-text-secondary">{investor.firm}</p>
                </div>
              </div>

              <dl className="mt-5 flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">Ticket size</dt>
                  <dd className="font-medium text-text-primary">{investor.ticketSize}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">Portfolio</dt>
                  <dd className="font-medium text-text-primary">{investor.portfolioCount} startups</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {investor.industries.map((industry) => (
                  <Badge key={industry} variant="brand">
                    {industry}
                  </Badge>
                ))}
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <Badge variant={investor.openForPitches ? "success" : "neutral"}>
                  {investor.openForPitches ? "Open for pitches" : "Not currently reviewing"}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
