"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  action?: ReactNode;
  className?: string;
}

/** The eyebrow/title/description pattern repeated across every marketing section — one implementation, one animation. */
export function SectionHeading({ eyebrow, title, description, align = "center", action, className }: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45 }}
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "mx-auto max-w-2xl items-center text-center" : "max-w-2xl items-start text-left",
        action && "sm:flex-row sm:items-end sm:justify-between sm:text-left sm:max-w-none",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-3", align === "center" && !action && "items-center")}>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">{eyebrow}</span>
        <h2 className="font-heading text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">{title}</h2>
        {description && <p className="text-text-secondary">{description}</p>}
      </div>
      {action}
    </motion.div>
  );
}
