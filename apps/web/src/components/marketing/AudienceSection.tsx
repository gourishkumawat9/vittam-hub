"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

const AUDIENCES = [
  {
    id: "founders",
    eyebrow: "For founders",
    title: "Build a profile investors actually find",
    description: "One verified profile that showcases your journey — no more cold emails and scattered decks.",
    points: [
      "Verified startup profile with your full story",
      "Get discovered by investors matched to your stage and industry",
      "Track interest and manage connection requests in one inbox",
    ],
    cta: { label: "Create your founder profile", href: "/register?role=founder" },
  },
  {
    id: "investors-audience",
    eyebrow: "For investors",
    title: "Discover deal flow through transparency",
    description: "Browse verified startups filtered by stage, industry, and traction — not cold inbound.",
    points: [
      "Curated discovery feed matched to your thesis",
      "Verified founders and startup data you can trust",
      "Reach out directly, backed by a transparent track record",
    ],
    cta: { label: "Create your investor profile", href: "/register?role=investor" },
  },
];

export function AudienceSection() {
  return (
    <section className="mx-auto max-w-content px-6 py-24">
      <div className="grid gap-6 lg:grid-cols-2">
        {AUDIENCES.map((audience, index) => (
          <motion.div
            key={audience.id}
            id={audience.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
            className="flex flex-col rounded-card border border-border bg-surface p-8 shadow-sm lg:p-10"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
              {audience.eyebrow}
            </span>
            <h3 className="mt-3 font-heading text-2xl font-bold tracking-tight text-text-primary">
              {audience.title}
            </h3>
            <p className="mt-3 text-text-secondary">{audience.description}</p>

            <ul className="mt-6 flex flex-col gap-3">
              {audience.points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-text-primary">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>

            <Link
              href={audience.cta.href}
              className="mt-8 inline-flex w-fit items-center gap-2 rounded-button bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {audience.cta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
