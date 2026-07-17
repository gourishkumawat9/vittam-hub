"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useScrolled } from "@/hooks/useScrolled";
import { cn } from "@/lib/utils";

import { NavDropdown, type NavDropdownItem } from "./NavDropdown";

const DISCOVER_ITEMS: NavDropdownItem[] = [
  { label: "Discover startups", href: "#discover-startups", description: "Browse verified startup profiles" },
  { label: "Featured investors", href: "#investors", description: "See who's actively deploying capital" },
  { label: "Platform ecosystem", href: "#ecosystem", description: "Everyone VittamHub connects" },
];

const STARTUP_ITEMS: NavDropdownItem[] = [
  { label: "For startups", href: "#founders", description: "Build your verified Startup Passport" },
  { label: "The startup journey", href: "#journey", description: "From idea to unicorn" },
  { label: "Register your startup", href: "/register?role=founder" },
];

const INVESTOR_ITEMS: NavDropdownItem[] = [
  { label: "For investors", href: "#investors-audience", description: "Discover deal flow through transparency" },
  { label: "Featured investors", href: "#investors", description: "Meet active investors on the platform" },
  { label: "Register as investor", href: "/register?role=investor" },
];

const SIMPLE_LINKS = [
  { href: "#community", label: "Community" },
  { href: "#learning", label: "Learning Hub" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function NavBar() {
  const scrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-stickyNav transition-colors duration-200",
        scrolled ? "nav-blur" : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-6">
        <Link href="/" className="shrink-0" aria-label="VittamHub home">
          <Logo height={44} />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          <NavDropdown label="Discover" items={DISCOVER_ITEMS} />
          <NavDropdown label="Startups" items={STARTUP_ITEMS} />
          <NavDropdown label="Investors" items={INVESTOR_ITEMS} />
          {SIMPLE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-button px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-background-secondary"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-button bg-brand-primary px-5 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Get started
          </Link>
        </div>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center text-text-primary lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border bg-background px-6 py-4 lg:hidden" aria-label="Mobile">
          <ul className="flex flex-col gap-4">
            {[...DISCOVER_ITEMS, ...STARTUP_ITEMS.slice(0, 2), ...INVESTOR_ITEMS.slice(0, 2), ...SIMPLE_LINKS].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block text-sm font-medium text-text-secondary"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/login"
              className="rounded-button border border-border px-4 py-2.5 text-center text-sm font-medium text-text-primary"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-button bg-brand-primary px-4 py-2.5 text-center text-sm font-medium text-white"
            >
              Get started
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
