import Link from "next/link";

import { Logo } from "@/components/Logo";
import { AUDIENCES } from "@/data/audiences";

const FOOTER_COLUMNS = [
  {
    title: "Who it's for",
    links: [...AUDIENCES.map((audience) => ({ label: audience.label, href: `/for/${audience.id}` })), { label: "Community", href: "/#community" }],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Your account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Create a free account", href: "/register" },
      { label: "Forgot password", href: "/forgot-password" },
    ],
  },
];

/**
 * Navy footer, the closing band of every marketing page. Every link goes to a
 * real page: no placeholder "#" links or social icons until those accounts
 * exist. The official logo sits on navy as provided (CLAUDE.md §1).
 */
export function Footer() {
  return (
    <footer className="theme-navy">
      <div className="mx-auto grid max-w-content gap-12 px-6 py-16 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo height={30} />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-text-secondary">
            Visibility for tomorrow&apos;s unicorns. The digital identity and discovery platform for startups, from idea to unicorn.
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-primary">{column.title}</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-text-secondary transition-colors hover:text-text-primary hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-content px-6 py-6 text-sm text-text-secondary">
          © {new Date().getFullYear()} VittamHub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
