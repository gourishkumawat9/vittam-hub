"use client";

import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "../../lib/cn";

export interface RadioCardOption {
  value: string;
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  benefits?: string[];
}

interface RadioCardGroupProps {
  options: RadioCardOption[];
  value: string | string[];
  onChange: (value: string) => void;
  multiple?: boolean;
  columns?: 1 | 2 | 3 | 4;
  name?: string;
}

/** Big, premium selectable cards — used for account-type selection and any other "pick one (or more) from a rich set of options" step. */
export function RadioCardGroup({ options, value, onChange, multiple = false, columns = 2, name }: RadioCardGroupProps) {
  const selectedValues = Array.isArray(value) ? value : [value];

  const columnClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div role={multiple ? "group" : "radiogroup"} className={cn("grid gap-4", columnClass)}>
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={isSelected}
            name={name}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-start gap-3 rounded-card border-2 bg-surface p-5 text-left shadow-sm transition-all hover:shadow-md",
              isSelected ? "border-brand-primary ring-2 ring-brand-primary/20" : "border-border",
            )}
          >
            <div className="flex w-full items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-xl">
                {option.icon ? <option.icon className="h-5 w-5 text-brand-700" aria-hidden="true" /> : option.emoji}
              </div>
              {isSelected && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary">
                  <Check className="h-3.5 w-3.5 text-white" />
                </span>
              )}
            </div>

            <div>
              <h3 className="font-heading text-base font-semibold text-text-primary">{option.title}</h3>
              {option.description && <p className="mt-1 text-sm text-text-secondary">{option.description}</p>}
            </div>

            {option.benefits && option.benefits.length > 0 && (
              <ul className="flex flex-col gap-1.5 border-t border-border pt-3">
                {option.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-xs text-text-secondary">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-success-600" aria-hidden="true" />
                    {benefit}
                  </li>
                ))}
              </ul>
            )}
          </button>
        );
      })}
    </div>
  );
}
