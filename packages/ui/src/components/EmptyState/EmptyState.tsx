import type { LucideIcon } from "lucide-react";

import { cn } from "../../lib/cn";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Standard "nothing here yet" state — every list/table/dashboard panel should render this instead of a blank div. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-card border border-dashed border-border px-6 py-16 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background-secondary">
        <Icon className="h-6 w-6 text-text-secondary" aria-hidden="true" />
      </div>
      <h3 className="font-heading text-base font-semibold text-text-primary">{title}</h3>
      {description && <p className="max-w-sm text-sm text-text-secondary">{description}</p>}
      {action}
    </div>
  );
}
