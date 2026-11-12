import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const TILES = [
  {
    title: "Ready to join?",
    description: "Create your free account and set up your profile in a few minutes.",
    href: "/register",
    label: "Get started",
    tone: "theme-navy",
  },
  {
    title: "Plans and pricing",
    description: "Start free. See what's included today and what's planned next.",
    href: "/pricing",
    label: "See pricing",
    tone: "bg-brand-600 text-white",
  },
  {
    title: "What we stand for",
    description: "Trust earned through evidence, automated checks and no gatekeepers.",
    href: "/about",
    label: "About VittamHub",
    tone: "border border-border bg-surface text-text-primary",
  },
];

/** BCG's closing trio of tiles (Ready to apply / Benefits / What we stand for). */
export function CtaTiles() {
  return (
    <section className="bg-background-secondary">
      <div className="mx-auto grid max-w-content gap-6 px-6 py-20 md:grid-cols-3 lg:py-24">
        {TILES.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className={cn("group flex min-h-56 flex-col rounded-card p-8 transition-shadow duration-150 hover:shadow-lg", tile.tone)}
          >
            <h2 className="font-heading text-2xl font-bold leading-snug">{tile.title}</h2>
            <p className={cn("mt-3 text-sm leading-relaxed", tile.tone.includes("bg-surface") ? "text-text-secondary" : "text-white/85")}>
              {tile.description}
            </p>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-8 text-sm font-semibold">
              {tile.label}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
