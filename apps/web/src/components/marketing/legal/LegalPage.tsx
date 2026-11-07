/**
 * Shared shell for /privacy and /terms: one readable column (~70ch), real
 * heading hierarchy, and a "last updated" line. Content lives in each page
 * as plain sections so legal edits never touch layout code.
 */
export const LEGAL_CONTACT_EMAIL = "privacy@vittamhub.com";

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: string; sections: LegalSection[] }) {
  return (
    <article className="mx-auto max-w-[70ch] px-6 py-20">
      <h1 className="font-heading text-3xl font-semibold text-text-primary sm:text-4xl">{title}</h1>
      <p className="mt-3 text-sm text-text-secondary">Last updated {updated}</p>
      <p className="mt-8 text-base leading-relaxed text-text-secondary">{intro}</p>

      {sections.map((section) => (
        <section key={section.heading} className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-text-primary">{section.heading}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-base leading-relaxed text-text-secondary">
              {paragraph}
            </p>
          ))}
          {section.bullets && (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-text-secondary">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <p className="mt-12 border-t border-border pt-6 text-sm text-text-secondary">
        Questions? Write to{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="font-medium text-brand-primary underline">
          {LEGAL_CONTACT_EMAIL}
        </a>
        .
      </p>
    </article>
  );
}
