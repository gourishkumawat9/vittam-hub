import { Accordion } from "@vittamhub/ui";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConnectRequestsBand } from "@/components/marketing/ConnectRequestsBand";
import { StepsRow } from "@/components/marketing/HowItWorks";
import { JoinBand } from "@/components/marketing/JoinBand";
import { PageHero } from "@/components/marketing/PageHero";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { cta } from "@/components/marketing/cta";
import { AUDIENCES, findAudience } from "@/data/audiences";

type Params = { params: { audience: string } };

export const dynamicParams = false;

export function generateStaticParams() {
  return AUDIENCES.map((audience) => ({ audience: audience.id }));
}

export function generateMetadata({ params }: Params): Metadata {
  const audience = findAudience(params.audience);
  if (!audience) return {};
  return {
    title: audience.eyebrow,
    description: audience.metaDescription,
    alternates: { canonical: `/for/${audience.id}` },
  };
}

/**
 * One page per stakeholder, after BCG's audience pages: navy hero, what you
 * can do, how it works, questions, other paths, and a sign-up band. Content
 * lives in data/audiences.ts; founders and investors also get the connect
 * request band, since it's the loop between them.
 */
export default function AudiencePage({ params }: Params) {
  const audience = findAudience(params.audience);
  if (!audience) notFound();

  const registerHref = `/register?role=${audience.registerRole}`;
  const others = AUDIENCES.filter((other) => other.id !== audience.id);
  const shortName = audience.label.toLowerCase();

  return (
    <>
      <PageHero
        eyebrow={audience.eyebrow}
        title={audience.heroTitle}
        intro={audience.heroIntro}
        icon={audience.icon}
        actions={
          <>
            <Link href={registerHref} className={cta.onNavy}>
              {audience.ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/login" className={cta.outlineOnDark}>
              Log in
            </Link>
          </>
        }
      />

      <section className="bg-background">
        <div className="mx-auto max-w-content px-6 py-20 lg:py-24">
          <SectionHeading eyebrow="What you can do" title={`Everything ${shortName} need, in one place`} />
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {audience.capabilities.map((capability) => (
              <li key={capability.title} className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6 lg:p-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-brand-50 text-brand-700 dark:bg-brand-primary/15 dark:text-brand-primary">
                  <capability.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-heading text-lg font-bold text-text-primary">{capability.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{capability.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-y border-border bg-background-secondary">
        <div className="mx-auto max-w-content px-6 py-20 lg:py-24">
          <SectionHeading eyebrow="How it works" title="Up and running in four steps" />
          <div className="mt-12">
            <StepsRow steps={audience.steps} />
          </div>
        </div>
      </section>

      {(audience.id === "founders" || audience.id === "investors") && <ConnectRequestsBand />}

      <section className="bg-background">
        <div className="mx-auto grid max-w-content gap-10 px-6 py-20 lg:grid-cols-[1fr_1.4fr] lg:gap-16 lg:py-24">
          <SectionHeading eyebrow="Questions" title={`What ${shortName} ask us`} />
          <Accordion
            className="bg-surface"
            items={audience.faq.map((item, index) => ({ value: `q${index}`, question: item.question, answer: item.answer }))}
          />
        </div>
      </section>

      <section className="border-t border-border bg-background-secondary">
        <div className="mx-auto max-w-content px-6 py-20 lg:py-24">
          <SectionHeading eyebrow="Explore" title="The rest of the ecosystem" />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((other) => (
              <li key={other.id}>
                <Link
                  href={`/for/${other.id}`}
                  className="group flex h-full flex-col gap-3 rounded-card border border-border bg-surface p-6 transition-[border-color,box-shadow] duration-150 hover:border-brand-primary/50 hover:shadow-md"
                >
                  <other.icon className="h-6 w-6 text-brand-primary" aria-hidden="true" />
                  <span className="font-heading text-lg font-bold text-text-primary">{other.label}</span>
                  <span className="text-sm leading-relaxed text-text-secondary">{other.cardTitle}</span>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-brand-primary">
                    Learn more
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <JoinBand
        title={`Ready to join as ${audience.singular}?`}
        description="It's free, and your profile is ready in a few minutes."
        registerHref={registerHref}
        registerLabel={audience.ctaLabel}
      />
    </>
  );
}
