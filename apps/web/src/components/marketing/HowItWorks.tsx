"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Compass, Rocket, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Fragment } from "react";

import { SectionHeading } from "./SectionHeading";

const STEPS: { title: string; description: string; icon: LucideIcon }[] = [
  { title: "Create your startup", description: "Set up your Startup Passport in minutes.", icon: Rocket },
  { title: "Get verified", description: "Our team reviews and verifies your profile.", icon: ShieldCheck },
  { title: "Gain visibility", description: "Appear in discovery, matched to the right audience.", icon: Compass },
  { title: "Connect with investors", description: "Receive and manage introduction requests directly.", icon: Users },
];

export function HowItWorks() {
  return (
    <section className="border-t border-border bg-background-secondary">
      <div className="mx-auto max-w-content px-6 py-24">
        <SectionHeading eyebrow="How it works" title="From sign-up to visibility in four steps" />

        <div className="mt-16 flex flex-col items-stretch gap-2 lg:flex-row">
          {STEPS.map((step, index) => (
            <Fragment key={step.title}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex flex-1 flex-col items-center gap-3 rounded-card border border-border bg-surface p-6 text-center shadow-sm"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-white">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-numeric text-xs font-bold text-brand-primary">STEP {index + 1}</span>
                <h3 className="font-heading text-base font-semibold text-text-primary">{step.title}</h3>
                <p className="text-sm text-text-secondary">{step.description}</p>
              </motion.div>

              {index < STEPS.length - 1 && (
                <motion.div
                  aria-hidden="true"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
                  className="flex shrink-0 items-center justify-center py-1 lg:py-0"
                >
                  <ArrowDown className="h-5 w-5 text-border lg:hidden" />
                  <ArrowRight className="hidden h-5 w-5 text-border lg:block" />
                </motion.div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
