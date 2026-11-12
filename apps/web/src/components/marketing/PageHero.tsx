import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Navy hero for every page below the home page (audience pages, About,
 * Pricing): eyebrow, one big line, a short intro and the page's actions.
 * `icon` adds the audience's mark on the right on wide screens.
 */
export function PageHero({
  eyebrow,
  title,
  intro,
  actions,
  icon: Icon,
  className,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  actions?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <section className={cn("theme-navy relative overflow-hidden", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_85%_30%,rgb(46_111_209/0.35),transparent_70%)]"
      />
      {Icon && (
        <div aria-hidden="true" className="pointer-events-none absolute right-[8%] top-1/2 hidden -translate-y-1/2 lg:block">
          <div className="relative flex h-72 w-72 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div className="absolute inset-10 rounded-full border border-white/15" />
            <div className="absolute inset-20 rounded-full bg-white/5 ring-1 ring-white/20" />
            <Icon className="relative h-16 w-16 text-brand-primary" strokeWidth={1.5} />
          </div>
        </div>
      )}
      <div className="relative mx-auto max-w-content px-6 pb-16 pt-14 lg:pb-24 lg:pt-20">
        <div className="flex max-w-2xl flex-col items-start gap-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">{eyebrow}</p>
          <h1 className="font-heading text-4xl font-bold leading-[1.08] tracking-tight text-text-primary sm:text-5xl">{title}</h1>
          {intro && <p className="text-lg leading-relaxed text-text-secondary">{intro}</p>}
          {actions && <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
