"use client";

import { ArrowRight, Github, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/Logo";

const FOOTER_LINKS = {
  Company: [
    { label: "About", href: "/about" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Press", href: "#" },
  ],
  Community: [
    { label: "Discover startups", href: "#discover-startups" },
    { label: "Featured investors", href: "#investors" },
    { label: "Learning Hub", href: "#learning" },
    { label: "Events", href: "#community" },
  ],
  Support: [
    { label: "Documentation", href: "#" },
    { label: "Privacy policy", href: "#" },
    { label: "Terms of service", href: "#" },
  ],
};

const SOCIAL_LINKS = [
  { label: "Twitter", href: "#", icon: Twitter },
  { label: "LinkedIn", href: "#", icon: Linkedin },
  { label: "GitHub", href: "#", icon: Github },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-content gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2 lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-text-secondary">
            Visibility for tomorrow&apos;s unicorns — one verified digital identity, one discovery platform.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:bg-background-secondary hover:text-text-primary"
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
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
          <h3 className="text-sm font-semibold text-text-primary">Stay in the loop</h3>
          <p className="mt-3 text-sm text-text-secondary">Product updates and founder stories, no more than monthly.</p>
          <form onSubmit={(event) => event.preventDefault()} className="mt-4 flex items-center gap-2">
            <label htmlFor="footer-newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-newsletter-email"
              type="email"
              required
              placeholder="you@startup.com"
              className="w-full rounded-button border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            />
            <button
              type="submit"
              aria-label="Subscribe"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button bg-brand-primary text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
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
