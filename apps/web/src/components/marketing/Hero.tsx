import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { cta } from "./cta";
import { HeroFilm } from "./hero/HeroFilm";

/**
 * Navy hero, after the BCG careers page: a short tagline, one strong line,
 * one primary action. The brand film plays on the right; inside `theme-navy`
 * it picks its dark palette by itself.
 */
export function Hero() {
  return (
    <section className="theme-navy relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_65%_at_80%_20%,rgb(46_111_209/0.32),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-content items-center gap-10 px-6 pb-14 pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24 lg:pt-20">
        <div className="flex flex-col items-start gap-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">Visibility for tomorrow&apos;s unicorns</p>
          <h1 className="font-heading text-4xl font-bold leading-[1.06] tracking-tight text-text-primary sm:text-5xl xl:text-6xl">
            The digital identity for every startup.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-text-secondary">
            Build trust, show your journey, and connect with investors, mentors, incubators and universities in one place, from
            your first idea to your unicorn moment.
          </p>
          <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/register" className={cta.onNavy}>
              Get started free
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="#how-it-works" className={cta.outlineOnDark}>
              See how it works
            </Link>
          </div>
        </div>

        <div className="-mx-6 sm:mx-0">
          <HeroFilm />
        </div>
      </div>
    </section>
  );
}
