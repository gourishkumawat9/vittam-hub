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
 * The light footer of every marketing page. Every link goes to a real page:
 * no placeholder "#" links, social icons or newsletter box until those
 * accounts and lists exist.
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-content gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(3,1fr)]">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-text-secondary">
            Visibility for tomorrow&apos;s unicorns: one verified digital identity, one discovery platform.
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <h2 className="text-sm font-semibold text-text-primary">{column.title}</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-text-secondary transition-colors hover:text-text-primary">
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
