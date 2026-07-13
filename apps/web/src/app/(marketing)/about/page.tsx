import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "VittamHub's mission is a verified digital identity for every startup.",
};

/** Placeholder — full company story/team page lands in a later pass; kept as a real route so /about never 404s. */
export default function AboutPage() {
  return (
    <section className="mx-auto flex max-w-content flex-col items-center gap-6 px-6 py-32 text-center">
      <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">About VittamHub</span>
      <h1 className="max-w-2xl font-heading text-4xl font-bold tracking-tight text-text-primary">
        Every startup deserves a verified digital identity.
      </h1>
      <p className="max-w-xl text-text-secondary">
        VittamHub helps founders build trust, gain visibility, and connect with investors, mentors, incubators,
        universities, and strategic partners — through one integrated ecosystem. We believe investors should
        discover startups through transparency, not cold outreach.
      </p>
    </section>
  );
}
