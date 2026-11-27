"use client";

import { Plus } from "@vittamhub/ui/icons";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

import { HOME_FAQ } from "@/data/faq";
import { cn } from "@/lib/utils";

/** Common questions, one open at a time, beside a short heading and a way in. */
export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto grid max-w-content gap-12 px-6 py-24 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="flex flex-col gap-4 lg:col-span-4"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">FAQ</span>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">Questions founders ask</h2>
          <p className="text-text-secondary">How VittamHub works today, in plain words. Anything else is easier to see from the inside.</p>
          <Link href="/register" className="mt-2 w-fit text-sm font-semibold text-brand-primary hover:underline">
            Create a free account →
          </Link>
        </motion.div>

        <ul className="flex flex-col divide-y divide-border border-y border-border lg:col-span-8">
          {HOME_FAQ.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-answer-${index}`;
            return (
              <li key={item.question}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left font-heading text-base font-semibold text-text-primary transition-colors hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary sm:text-lg"
                  >
                    {item.question}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border transition-[transform,background-color,color] duration-300",
                        isOpen ? "rotate-45 border-brand-primary bg-brand-primary text-white" : "text-text-secondary",
                      )}
                    >
                      <Plus className="h-4 w-4" />
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 pr-12 text-text-secondary">{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
