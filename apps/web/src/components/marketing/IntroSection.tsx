import { Award, Send, ShieldCheck } from "lucide-react";

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Automated verification",
    description: "Verification status comes from automated checks on what each profile adds. There's no manual review queue.",
  },
  {
    icon: Send,
    title: "Requests, not cold messages",
    description: "Founders reach investors through structured connect requests. Chat opens only after an investor accepts.",
  },
  {
    icon: Award,
    title: "Trust you can see",
    description: "Every startup's Trust Score comes with its breakdown, and it rises with evidence, never with claims alone.",
  },
];

/** The BCG-style intro statement under the hero, with the three ideas the platform is built on. */
export function IntroSection() {
  return (
    <section className="bg-background">
      <div className="mx-auto grid max-w-content gap-10 px-6 py-20 lg:grid-cols-[1fr_1.25fr] lg:gap-16 lg:py-24">
        <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight text-text-primary sm:text-4xl lg:text-[2.75rem]/[1.12]">
          One trusted place for the whole startup ecosystem.
        </h2>
        <div>
          <p className="text-lg leading-relaxed text-text-secondary lg:text-xl">
            VittamHub gives every startup a verified digital identity and connects it to the investors, mentors, incubators and
            universities that help it grow. Investors discover startups through transparency, not cold outreach.
          </p>
          <ul className="mt-10 grid gap-8 border-t border-border pt-8 sm:grid-cols-3 sm:gap-6">
            {PILLARS.map((pillar) => (
              <li key={pillar.title} className="flex flex-col gap-3">
                <pillar.icon className="h-6 w-6 text-brand-primary" aria-hidden="true" />
                <h3 className="font-heading text-base font-bold text-text-primary">{pillar.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{pillar.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
