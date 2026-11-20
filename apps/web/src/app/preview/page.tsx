import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Logo } from "@/components/Logo";
import { isLiveHost, previewFlagSet } from "@/lib/preview/mode";
import { asRole, PREVIEW_AREAS } from "@/lib/preview/pages";

export const metadata: Metadata = {
  title: "Dashboard preview",
  robots: { index: false, follow: false },
};

/**
 * The list of every dashboard in preview mode (see lib/preview/mode.ts).
 * Doesn't exist on the live site. Links are plain <a> tags on purpose: each
 * one is a full page load, so switching demo account starts clean.
 */
export default async function PreviewIndexPage() {
  const host = (await headers()).get("host");
  if (!previewFlagSet() || isLiveHost(host)) notFound();

  return (
    <main className="min-h-screen bg-background-secondary px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Logo height={28} />
        <h1 className="mt-8 font-heading text-3xl font-semibold text-text-primary">Dashboard preview</h1>
        <p className="mt-2 max-w-2xl text-text-secondary">
          Every dashboard, without signing in. Everything you see is demo data, and nothing you click is saved. This is a separate
          preview copy, not the live site.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {PREVIEW_AREAS.map((area) => (
            <section key={area.role} className="rounded-card border border-border bg-surface p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-text-primary">{area.title}</h2>
              <p className="mt-1 text-sm text-text-secondary">{area.summary}</p>
              <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
                {area.pages.map((p) => (
                  <li key={p.href}>
                    <a
                      href={asRole(p.href, area.role)}
                      className="block rounded-button px-2 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:text-brand-primary"
                    >
                      {p.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-8 text-sm text-text-secondary">
          Also in the preview: the <Link className="font-medium text-brand-700 hover:underline" href="/">home page</Link>,{" "}
          <Link className="font-medium text-brand-700 hover:underline" href="/login">login</Link> and{" "}
          <Link className="font-medium text-brand-700 hover:underline" href="/register">sign-up</Link>.
        </p>
      </div>
    </main>
  );
}
