import { AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "../../lib/cn";

export interface ErrorStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
  className?: string;
}

/** Standard "something went wrong" state — sibling to `EmptyState`, same shape, for every query's `isError` branch. */
export function ErrorState({
  icon: Icon = AlertTriangle,
  title = "Something went wrong",
  description = "That didn't load. Try again in a moment.",
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-card border border-dashed border-danger-200 px-6 py-16 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-50">
        <Icon className="h-6 w-6 text-danger-600" aria-hidden="true" />
      </div>
      <h3 className="font-heading text-base font-semibold text-text-primary">{title}</h3>
      {description && <p className="max-w-sm text-sm text-text-secondary">{description}</p>}
      {action ??
        (onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-button border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-background-secondary"
          >
            Try again
          </button>
        ))}
    </div>
  );
}
