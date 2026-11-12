"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { findAudience } from "@/data/audiences";
import { useScrolled } from "@/hooks/useScrolled";
import { cn } from "@/lib/utils";

import { NavDropdown, type NavDropdownItem } from "./NavDropdown";

/** A /for/<id> page link, described with that page's own card title so the two never drift apart. */
function audienceItem(id: string): NavDropdownItem {
  const audience = findAudience(id);
  return { label: `For ${id}`, href: `/for/${id}`, description: audience?.cardTitle };
}

// Home sections are linked as "/#id", not "#id", so they also work from About, Pricing and the audience pages.
const DISCOVER_ITEMS: NavDropdownItem[] = [
  { label: "Discover startups", href: "/#discover-startups", description: "See what a startup profile shows" },
  { label: "Investor profiles", href: "/#investors", description: "Ticket size, industries and stage at a glance" },
  { label: "Platform ecosystem", href: "/#ecosystem", description: "Everyone VittamHub connects" },
];

const STARTUP_ITEMS: NavDropdownItem[] = [
  audienceItem("founders"),
  { label: "The startup journey", href: "/#journey", description: "From idea to unicorn" },
  { label: "Register your startup", href: "/register?role=founder" },
];

const INVESTOR_ITEMS: NavDropdownItem[] = [
  audienceItem("investors"),
  { label: "Investor profiles", href: "/#investors", description: "How investors appear on VittamHub" },
  { label: "Register as investor", href: "/register?role=investor" },
];

const ECOSYSTEM_ITEMS: NavDropdownItem[] = [audienceItem("mentors"), audienceItem("incubators"), audienceItem("universities")];

const SIMPLE_LINKS = [
  { href: "/#community", label: "Community" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

const MOBILE_GROUPS = [
  { title: "Discover", items: DISCOVER_ITEMS },
  { title: "Who it's for", items: [STARTUP_ITEMS[0]!, INVESTOR_ITEMS[0]!, ...ECOSYSTEM_ITEMS] },
  { title: "VittamHub", items: SIMPLE_LINKS },
];

export function NavBar() {
  const scrolled = useScrolled();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-stickyNav transition-colors duration-200",
        scrolled || mobileOpen ? "nav-blur" : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-6">
        <Link href="/" className="shrink-0" aria-label="VittamHub home">
          {/* 44px inside a 64px bar left the mark filling ~70% of the nav and
              dominating the viewport on phones. 28/32px reads as a confident
              brand mark rather than a splash screen. */}
          <span className="hidden sm:block">
            <Logo height={32} />
          </span>
          <span className="sm:hidden">
            <Logo height={26} />
          </span>
        </Link>

        <nav className="hidden items-center gap-7 xl:flex" aria-label="Primary">
          <NavDropdown label="Discover" items={DISCOVER_ITEMS} />
          <NavDropdown label="Startups" items={STARTUP_ITEMS} />
          <NavDropdown label="Investors" items={INVESTOR_ITEMS} />
          <NavDropdown label="Ecosystem" items={ECOSYSTEM_ITEMS} />
          {SIMPLE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={cn(
                "text-sm font-medium transition-colors hover:text-text-primary",
                pathname === link.href ? "text-text-primary" : "text-text-secondary",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
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

        <div className="flex items-center gap-1 xl:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center text-text-primary"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-nav"
          className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border bg-background px-6 py-4 xl:hidden"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-6">
            {MOBILE_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">{group.title}</p>
                <ul className="mt-3 flex flex-col gap-3">
                  {group.items.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="block text-sm font-medium text-text-secondary" onClick={() => setMobileOpen(false)}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/login"
              className="rounded-button border border-border px-4 py-2.5 text-center text-sm font-medium text-text-primary"
            >
              Log in
            </Link>
            <Link href="/register" className="rounded-button bg-brand-primary px-4 py-2.5 text-center text-sm font-medium text-white">
              Get started
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
