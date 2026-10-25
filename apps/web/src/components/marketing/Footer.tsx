"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/Logo";

// Only links that lead somewhere real. Careers, Blog, Press, Documentation and
// the social icons pointed at "#" and are left out until those pages exist.
const FOOTER_LINKS = {
  Company: [
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
  ],
  Community: [
    { label: "Discover startups", href: "/#discover-startups" },
    { label: "Featured investors", href: "/#investors" },
    { label: "Domain communities", href: "/communities" },
    { label: "Learning Hub", href: "/#learning" },
  ],
  Legal: [
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of service", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-content gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2 lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-text-secondary">
            Visibility for tomorrow&apos;s unicorns: one verified digital identity, one discovery platform.
          </p>
        </div>

        {Object.entries(FOOTER_LINKS).map(([section, links]) => (
          <div key={section}>
            <h3 className="text-sm font-semibold text-text-primary">{section}</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-text-secondary transition-colors hover:text-text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="sm:col-span-2 lg:col-span-2">
          <h3 className="text-sm font-semibold text-text-primary">Join early access</h3>
          <p className="mt-3 text-sm text-text-secondary">Create a free profile and help shape VittamHub while it&apos;s in early access.</p>
          <Link
            href="/register"
            className="mt-4 inline-flex items-center gap-2 rounded-button bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-content px-6 py-6 text-sm text-text-secondary">
          © {new Date().getFullYear()} VittamHub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
