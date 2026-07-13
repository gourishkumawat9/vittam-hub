"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { TEAM_ROLES } from "@/data/team-builder";

import { SectionHeading } from "./SectionHeading";

export function TeamBuilder() {
  return (
    <section className="mx-auto max-w-content px-6 py-24">
      <SectionHeading eyebrow="Team Builder" title="Build the team your startup needs" />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {TEAM_ROLES.map((role, index) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: index * 0.07 }}
            whileHover={{ y: -4 }}
            className="flex flex-col items-start rounded-card border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-lg"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <role.icon className="h-4 w-4 text-brand-700" aria-hidden="true" />
            </div>
            <h3 className="mt-3 font-heading text-sm font-semibold text-text-primary">{role.title}</h3>
            <p className="mt-1.5 text-xs text-text-secondary">{role.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-button bg-brand-primary px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Build your team
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
