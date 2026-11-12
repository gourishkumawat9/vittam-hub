import { Check, FileText, Link2 } from "lucide-react";
import Link from "next/link";

import { cta } from "./cta";

const POINTS = [
  "The Free plan includes a monthly allowance of connect requests",
  "Investors can ask for more information before they decide",
  "Mentor session requests are separate and have no monthly limit",
];

/** A made-up request, labelled as one (CLAUDE.md §2), showing what an investor receives. */
function ExampleRequest() {
  return (
    <figure className="rounded-card border border-border bg-surface p-6 shadow-xl shadow-black/20 lg:p-8">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">Connect request</span>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-text-secondary">Example</span>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 font-heading text-sm font-bold text-text-primary">
          ES
        </span>
        <div>
          <p className="font-heading text-base font-bold text-text-primary">Example Startup</p>
          <p className="text-sm text-text-secondary">EdTech · MVP</p>
        </div>
      </div>

      <dl className="mt-6 flex flex-col gap-4 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Introduction</dt>
          <dd className="mt-1.5 leading-relaxed text-text-primary">
            We turn a semester syllabus into a daily study plan that adapts when a student falls behind. We&apos;d value your view on our
            pricing before our seed round.
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Funding requirement</dt>
          <dd className="mt-1.5 font-numeric font-semibold text-text-primary">₹25,00,000</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Attached</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1 text-xs text-text-primary">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" /> Pitch deck
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1 text-xs text-text-primary">
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" /> Demo link
            </span>
          </dd>
        </div>
      </dl>

      <div className="mt-7 grid grid-cols-3 gap-2 border-t border-border pt-5 text-center text-xs font-semibold" aria-hidden="true">
        <span className="rounded-button bg-brand-500 px-2 py-2.5 text-white">Accept</span>
        <span className="rounded-button border border-border px-2 py-2.5 text-text-primary">Ask for more</span>
        <span className="rounded-button border border-border px-2 py-2.5 text-text-primary">Decline</span>
      </div>
      <figcaption className="sr-only">An example connect request from a made-up startup.</figcaption>
    </figure>
  );
}

/**
 * The Smart Connect Request system (docs/12-connect-requests.md) as a navy
 * split band, in the place of BCG's "near you" block. No request count is
 * printed: the Free allowance is set by admins at runtime (CLAUDE.md §5).
 */
export function ConnectRequestsBand() {
  return (
    <section id="connect-requests" className="theme-navy">
      <div className="mx-auto grid max-w-content items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className="flex flex-col items-start gap-6">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">Smart connect requests</span>
          <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight text-text-primary sm:text-4xl lg:text-[2.75rem]/[1.12]">
            No cold messages. Every introduction comes with context.
          </h2>
          <p className="text-lg leading-relaxed text-text-secondary">
            Founders can&apos;t message investors directly. They send a connect request with an introduction, their funding requirement
            and, if they like, a pitch deck, summary or demo link. The investor accepts, declines or ignores it, and chat and meetings
            open only after they accept.
          </p>
          <ul className="flex flex-col gap-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-text-primary">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link href="/register?role=founder" className={cta.onNavy}>
              Start as a founder
            </Link>
            <Link href="/pricing" className={cta.outlineOnDark}>
              See what&apos;s free
            </Link>
          </div>
        </div>

        <ExampleRequest />
      </div>
    </section>
  );
}
