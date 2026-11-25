import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The top of every dashboard page: one title, one line of context, and the
 * page's actions on the right. Keeps every role's home reading the same way.
 */
export function PageHeader({
  title,
  description,
  meta,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small chips under the title (stage, verification, quota). */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="heading-5 truncate">{title}</h1>
        {description && <p className="caption-2 max-w-2xl">{description}</p>}
        {meta && <div className="flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** A heading for a group of panels, with an optional "see all" link on the right. */
export function SectionHeader({
  title,
  description,
  href,
  linkLabel = "See all",
  id,
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  id?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id={id} className="heading-6">
          {title}
        </h2>
        {description && <p className="caption-2">{description}</p>}
      </div>
      {href && <PanelLink href={href}>{linkLabel}</PanelLink>}
    </div>
  );
}

/** The quiet text link used in panel headers ("See all", "Open requests"). */
export function PanelLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex shrink-0 items-center gap-1 rounded-sm text-sm font-semibold text-brand-700 transition-colors duration-300 ease-base hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200",
        className,
      )}
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 ease-base group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

/** A panel's own title row: an icon, a title and an optional link or badge on the right. */
export function PanelTitle({
  icon: Icon,
  title,
  right,
  as: Tag = "h3",
}: {
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  title: string;
  right?: React.ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <Tag className="title-3 flex min-w-0 items-center gap-2">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />}
        <span>{title}</span>
      </Tag>
      {right}
    </div>
  );
}
