import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  align?: "center" | "left";
  /** A link or button shown at the right of the heading on wide screens. */
  action?: ReactNode;
  /** Heading level: sections use h2; a page whose hero is elsewhere can pass h1. */
  as?: "h1" | "h2";
  className?: string;
}

/**
 * The eyebrow / title / description block that opens every marketing
 * section. Left-aligned and large by default, in the BCG careers style the
 * site follows; `center` is for short closing sections.
 */
export function SectionHeading({ eyebrow, title, description, align = "left", action, as: Heading = "h2", className }: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        align === "center" ? "mx-auto max-w-3xl items-center text-center" : "items-start text-left",
        action && "lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className={cn("flex max-w-3xl flex-col gap-4", align === "center" && "items-center")}>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">{eyebrow}</span>
        <Heading className="font-heading text-3xl font-bold leading-tight tracking-tight text-text-primary sm:text-4xl lg:text-[2.75rem]/[1.12]">
          {title}
        </Heading>
        {description && <p className="text-lg leading-relaxed text-text-secondary">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** "Learn more →" style text link used under cards and headings. */
export function ArrowLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary underline-offset-4 hover:underline",
        className,
      )}
    >
      {children}
      <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}
