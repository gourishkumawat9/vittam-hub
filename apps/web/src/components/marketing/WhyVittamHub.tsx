import { PLATFORM_FEATURES } from "@/data/features";

import { SectionHeading } from "./SectionHeading";

/** The platform's building blocks as a quiet grid of tiles: icon, name, one line. Used on the About page. */
export function WhyVittamHub() {
  return (
    <section id="features" className="bg-background">
      <div className="mx-auto max-w-content px-6 py-20 lg:py-24">
        <SectionHeading
          eyebrow="What's inside"
          title="Everything visibility requires"
          description="One ecosystem for identity, discovery, growth and community, built for founders and investors who want transparency, not cold outreach."
        />

        <ul className="mt-12 grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_FEATURES.map((feature) => (
            <li key={feature.id} className="flex flex-col gap-3 bg-surface p-6 lg:p-8">
              <feature.icon className="h-6 w-6 text-brand-primary" aria-hidden="true" />
              <h3 className="font-heading text-lg font-bold text-text-primary">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{feature.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
