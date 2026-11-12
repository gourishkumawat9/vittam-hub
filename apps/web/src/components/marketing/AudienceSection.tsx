import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { AUDIENCES } from "@/data/audiences";
import { cn } from "@/lib/utils";

import { AudienceArt } from "./AudienceArt";
import { SectionHeading } from "./SectionHeading";

/**
 * "Who it's for": BCG's audience cards (picture, title, blurb, Learn more),
 * one per stakeholder. Founders and investors, the core loop, get the wide
 * cards on the first row.
 */
export function AudienceSection() {
  return (
    <section id="who-its-for" className="border-y border-border bg-background-secondary">
      <div className="mx-auto max-w-content px-6 py-20 lg:py-24">
        <SectionHeading
          eyebrow="Who it's for"
          title="Built for everyone who helps a startup grow"
          description="Founders, investors, mentors, incubators and universities each get their own profile, tools and dashboard."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-6">
          {AUDIENCES.map((audience, index) => {
            const wide = index < 2;
            return (
              <Link
                key={audience.id}
                href={`/for/${audience.id}`}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-card border border-border bg-surface transition-[border-color,box-shadow] duration-150 hover:border-brand-primary/50 hover:shadow-md",
                  wide ? "lg:col-span-3" : "lg:col-span-2",
                  index === AUDIENCES.length - 1 && "md:col-span-2 lg:col-span-2",
                )}
              >
                <AudienceArt icon={audience.icon} variant={index} className={wide ? "h-44 lg:h-52" : "h-40"} />
                <div className="flex flex-1 flex-col gap-3 p-6 lg:p-8">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">{audience.eyebrow}</span>
                  <h3 className={cn("font-heading font-bold leading-snug text-text-primary", wide ? "text-2xl" : "text-xl")}>
                    {audience.cardTitle}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{audience.cardBlurb}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-semibold text-brand-primary">
                    Learn more
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
