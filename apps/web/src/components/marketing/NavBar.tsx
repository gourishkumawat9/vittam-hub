"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AUDIENCES } from "@/data/audiences";
import { cn } from "@/lib/utils";

/** The six live areas (CLAUDE.md "Current scope"), in the order of the core loop. */
const AREA_LINKS = [
  ...AUDIENCES.map((audience) => ({ href: `/for/${audience.id}`, label: audience.label })),
  { href: "/#community", label: "Community" },
];

const COMPANY_LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

/**
 * A solid white bar, as on the BCG careers site the redesign follows: the six
 * areas as plain links with a blue underline for the page you're on, and the
 * two account actions on the right. Below 1280px it folds into one menu.
 */
export function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-stickyNav border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-6 px-6">
        <Link href="/" className="shrink-0" aria-label="VittamHub home">
          <span className="hidden sm:block">
            <Logo height={30} />
          </span>
          <span className="sm:hidden">
            <Logo height={24} />
          </span>
        </Link>

        <nav className="hidden h-full items-center gap-7 xl:flex" aria-label="Primary">
          {[...AREA_LINKS, ...COMPANY_LINKS].map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full items-center text-sm font-medium transition-colors",
                  "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand-primary after:transition-opacity",
                  active ? "text-text-primary after:opacity-100" : "text-text-secondary after:opacity-0 hover:text-text-primary hover:after:opacity-100",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-button px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-background-secondary"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-button bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            Get started
          </Link>
        </div>

        <div className="flex items-center gap-1 xl:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-button text-text-primary hover:bg-background-secondary"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-menu"
          className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border bg-surface px-6 pb-6 pt-2 xl:hidden"
          aria-label="Mobile"
        >
          <ul className="divide-y divide-border">
            {[...AREA_LINKS, ...COMPANY_LINKS].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className={cn(
                    "block py-3.5 text-base font-medium",
                    pathname === link.href ? "text-brand-primary" : "text-text-primary",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/login"
              className="rounded-button border border-border px-4 py-3 text-center text-sm font-semibold text-text-primary"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-button bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white dark:bg-brand-500"
            >
              Get started
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
