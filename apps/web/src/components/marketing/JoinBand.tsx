import Link from "next/link";

import { cta } from "./cta";

/**
 * The trust-blue band before the footer, where BCG asks visitors to join its
 * talent community. A plain sign-up link: there's no newsletter list behind
 * an email box yet, so the page doesn't pretend there is.
 */
export function JoinBand({
  title = "Join the VittamHub community",
  description = "Create your free profile and be part of the ecosystem from day one.",
  registerHref = "/register",
  registerLabel = "Create a free account",
}: {
  title?: string;
  description?: string;
  registerHref?: string;
  registerLabel?: string;
}) {
  return (
    <section className="bg-brand-600 dark:bg-brand-800">
      <div className="mx-auto flex max-w-content flex-col items-start gap-8 px-6 py-16 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">{title}</h2>
          <p className="mt-3 text-lg text-white/85">{description}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link href={registerHref} className={cta.white}>
            {registerLabel}
          </Link>
          <Link href="/login" className={cta.outlineOnDark}>
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}
