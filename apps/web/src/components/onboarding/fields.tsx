"use client";

import { ChevronDown } from "@vittamhub/ui/icons";
import { useId, type ReactNode } from "react";

import type { ChoiceOption } from "@/lib/startup-options";
import { cn } from "@/lib/utils";

/** The title block at the top of every wizard step. */
export function StepHeader({
  title,
  description,
  optional = false,
  minutes,
}: {
  title: string;
  description?: ReactNode;
  /** Marks a section the founder can skip, now or for good. */
  optional?: boolean;
  /** A rough time to finish the step, so the ask feels as small as it is. */
  minutes?: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="heading-5">{title}</h2>
        {optional && <span className="rounded-md bg-background-secondary px-2 py-0.5 text-xs font-medium text-text-secondary">Optional</span>}
        {minutes != null && (
          <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-white/10 dark:text-brand-300">
            About {minutes} min
          </span>
        )}
      </div>
      {description && <p className="body-5 max-w-2xl text-text-secondary">{description}</p>}
    </div>
  );
}

/** A titled group of fields inside a step. */
export function FieldSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="title-3">{title}</h3>
        {description && <p className="caption-5">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * One tap per answer: a row of pill buttons in place of a dropdown, for a
 * choice of up to about a dozen short options. Behaves as a radio group (or a
 * set of checkboxes with `multiple`), so screen readers announce it correctly.
 */
export function ChoiceChips<T extends string>({
  label,
  hint,
  required = false,
  options,
  value,
  onChange,
  error,
  multiple = false,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  options: ChoiceOption<T>[];
  value: T | T[] | undefined;
  onChange: (value: T) => void;
  error?: string;
  multiple?: boolean;
}) {
  const labelId = useId();
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <span id={labelId} className="text-sm font-medium text-text-primary">
          {label}
          {required && (
            <span className="ml-0.5 text-danger-600" aria-hidden="true">
              *
            </span>
          )}
        </span>
        {hint && <span className="caption-5">{hint}</span>}
      </div>
      <div role={multiple ? "group" : "radiogroup"} aria-labelledby={labelId} aria-required={required || undefined} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              role={multiple ? "checkbox" : "radio"}
              aria-checked={isSelected}
              title={option.hint}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200 ease-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1",
                isSelected
                  ? "border-brand-700 bg-brand-700 font-semibold text-white"
                  : "border-border bg-surface text-text-primary hover:border-brand-300 hover:bg-background-secondary",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-danger-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Fields a founder can fill now or later, folded away so the step shows only
 * what it needs. Opens by itself when something inside already has a value,
 * so nothing saved is ever hidden.
 */
export function MoreDetails({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-card border border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-card px-4 py-3.5 transition-colors hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary [&::-webkit-details-marker]:hidden">
        <span className="flex flex-col gap-0.5">
          <span className="title-4">{title}</span>
          {description && <span className="caption-5">{description}</span>}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="flex flex-col gap-4 border-t border-border px-4 py-5">{children}</div>
    </details>
  );
}

/** True when any of the given values has something in it, for opening a MoreDetails that holds saved answers. */
export function hasAny(values: unknown[]): boolean {
  return values.some((value) => {
    if (value === undefined || value === null || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });
}
