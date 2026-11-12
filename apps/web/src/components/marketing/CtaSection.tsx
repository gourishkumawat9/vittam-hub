"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { LogoMark } from "@/components/Logo";

/**
 * The closing card of the home page, in the brand blue (it was near-black
 * slate before the owner asked for no black sections), with two soft lights
 * drifting behind it and the official white mark on top.
 */
export function CtaSection() {
  return (
    <section className="mx-auto max-w-content px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.45 }}
        className="relative isolate overflow-hidden rounded-modal bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 px-8 py-16 text-center sm:px-16"
      >
        <div
          aria-hidden="true"
          className="bg-grid-pattern-white pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]"
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-28 -z-10 h-80 w-80 rounded-full bg-white/20 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 24, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-20 -z-10 h-96 w-96 rounded-full bg-brand-300/40 blur-3xl"
          animate={{ x: [0, -36, 0], y: [0, -20, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <LogoMark variant="white" className="mx-auto mb-6 h-12 w-12" />
        </motion.div>
        <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to build tomorrow&apos;s unicorn?</h2>
        <p className="mx-auto mt-4 max-w-xl text-white">
          Join VittamHub and build the verified digital identity your startup, or your next investment, deserves.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register?role=founder"
            className="inline-flex items-center justify-center gap-2 rounded-button bg-white px-6 py-3.5 text-sm font-semibold text-brand-800 shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Create startup
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/register?role=investor"
            className="inline-flex items-center justify-center rounded-button border border-white/50 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Register as investor
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
