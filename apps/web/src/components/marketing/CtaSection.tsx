"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { LogoMark } from "@/components/Logo";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-content px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-modal bg-slate-900 px-8 py-16 text-center sm:px-16"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-transparent to-transparent"
        />
        <LogoMark className="mx-auto mb-6 h-12 w-12 text-white" />
        <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to build tomorrow&apos;s unicorn?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-slate-300">
          Join VittamHub and build the verified digital identity your startup — or your next investment — deserves.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register?role=founder"
            className="inline-flex items-center justify-center gap-2 rounded-button bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Create startup
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/register?role=investor"
            className="inline-flex items-center justify-center rounded-button border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Register as investor
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
