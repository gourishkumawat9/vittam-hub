import { JOURNEY_STAGES } from "@/data/journey";

import { ArrowLink, SectionHeading } from "./SectionHeading";

/**
 * "Find your stage": BCG's "Find your team" grid, one tile per stage of the
 * journey, each saying what the stage is and how VittamHub helps there.
 */
export function StartupJourney() {
  return (
    <section id="journey" className="bg-background">
      <div className="mx-auto max-w-content px-6 py-20 lg:py-24">
        <SectionHeading
          eyebrow="Find your stage"
          title="Wherever your startup is today, start here"
          description="VittamHub grows with your startup, from the first idea to the unicorn milestone."
          action={<ArrowLink href="/for/founders">See everything founders get</ArrowLink>}
        />

        <ol className="mt-12 grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {JOURNEY_STAGES.map((stage, index) => (
            <li key={stage.id} className="flex flex-col gap-3 bg-surface p-6 lg:p-8">
              <span className="font-numeric text-sm font-semibold text-brand-primary">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="font-heading text-xl font-bold text-text-primary">{stage.label}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{stage.description}</p>
              <p className="mt-auto border-t border-border pt-4 text-sm leading-relaxed text-text-primary">
                <span className="font-semibold">How VittamHub helps: </span>
                {stage.howVittamHelps}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
