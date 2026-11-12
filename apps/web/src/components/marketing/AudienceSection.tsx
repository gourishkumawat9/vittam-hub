"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { PRODUCT_SHOTS } from "@/data/product-shots";

import { ProductShot } from "./ProductShot";

const AUDIENCES = [
  {
    id: "founders",
    eyebrow: "For founders",
    title: "Build a profile investors actually find",
    description: "One verified profile that showcases your journey. No more cold emails and scattered decks.",
    points: [
      "Verified startup profile with your full story",
      "Get discovered by investors matched to your stage and industry",
      "Track interest and manage connection requests in one inbox",
    ],
    cta: { label: "Create your founder profile", href: "/register?role=founder" },
    more: "/for/founders",
    image: PRODUCT_SHOTS.founders,
  },
  {
    id: "investors-audience",
    eyebrow: "For investors",
    title: "Discover deal flow through transparency",
    description: "Browse verified startups filtered by stage, industry, and traction, not cold inbound.",
    points: [
      "A discovery feed filtered to your thesis",
      "Verified founders and startup data you can trust",
      "Every introduction arrives as a connect request with context",
    ],
    cta: { label: "Create your investor profile", href: "/register?role=investor" },
    more: "/for/investors",
    image: PRODUCT_SHOTS.investors,
  },
];

/**
 * The two sides of the core loop. Each card ends in a real screen of that
 * side's dashboard (demo account), which rises a little when the card is
 * hovered.
 */
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
            className="group flex scroll-mt-20 flex-col overflow-hidden rounded-card border border-border bg-surface shadow-sm transition-shadow duration-300 hover:shadow-lg"
          >
            <div className="flex flex-1 flex-col p-8 lg:p-10">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">{audience.eyebrow}</span>
              <h3 className="mt-3 font-heading text-2xl font-bold tracking-tight text-text-primary">{audience.title}</h3>
              <p className="mt-3 text-text-secondary">{audience.description}</p>

              <ul className="mt-6 flex flex-col gap-3">
                {audience.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-text-primary">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href={audience.cta.href}
                  className="inline-flex w-fit items-center gap-2 rounded-button bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {audience.cta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={audience.more} className="text-sm font-semibold text-brand-primary hover:underline">
                  Learn more →
                </Link>
              </div>
            </div>

            <div className="relative h-56 overflow-hidden bg-gradient-to-b from-brand-50 to-brand-100 px-8 pt-8 dark:from-background-secondary dark:to-brand-950 sm:h-72 lg:px-10">
              <ProductShot
                image={audience.image}
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="translate-y-2 transition-transform duration-500 ease-out group-hover:-translate-y-2"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
