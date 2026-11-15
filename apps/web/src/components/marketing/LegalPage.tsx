import type { ReactNode } from "react";

import { PageHero } from "./PageHero";

export interface LegalSection {
  title: string;
  body: ReactNode;
}

/**
 * The layout of /privacy and /terms. Each page is a plain-language summary of
 * how the platform actually works, written from the code. The owner's full
 * legal text replaces the sections when it is ready; the notice says so.
 */
export function LegalPage({ eyebrow, title, intro, updated, sections }: { eyebrow: string; title: string; intro: string; updated: string; sections: LegalSection[] }) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} intro={intro} />
      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-6 py-16 lg:py-20">
          <p className="rounded-card border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-text-primary dark:bg-background-secondary" role="note">
            This is a plain-language summary of how VittamHub works today. The complete document will be published on this page before
            launch. Last updated {updated}.
          </p>
          <div className="mt-10 flex flex-col gap-10">
            {sections.map((section) => (
              <section key={section.title} aria-labelledby={`legal-${slug(section.title)}`}>
                <h2 id={`legal-${slug(section.title)}`} className="font-heading text-xl font-semibold text-text-primary">
                  {section.title}
                </h2>
                <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-text-secondary [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
                  {section.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
