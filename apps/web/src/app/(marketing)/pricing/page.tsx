import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description: "VittamHub pricing plans for startups and investors.",
};

/**
 * Placeholder — pricing tiers aren't finalized yet. Kept as a real route
 * (rather than a dead nav link) so /pricing never 404s; replace with actual
 * plan cards once pricing strategy is locked.
 */
export default function PricingPage() {
  return (
    <section className="mx-auto flex max-w-content flex-col items-center gap-6 px-6 py-32 text-center">
      <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary">Pricing</span>
      <h1 className="font-heading text-4xl font-bold tracking-tight text-text-primary">Plans are coming soon</h1>
      <p className="max-w-lg text-text-secondary">
        We&apos;re finalizing pricing for founders and investors. Get started for free today — we&apos;ll notify you
        before anything changes.
      </p>
      <Link
        href="/register"
        className="rounded-button bg-brand-primary px-6 py-3 font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Get started free
      </Link>
    </section>
  );
}
