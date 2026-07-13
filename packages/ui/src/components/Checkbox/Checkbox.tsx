"use client";

import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { useId } from "react";
import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: ReactNode;
  error?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onCheckedChange, label, error, disabled }: CheckboxProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2.5">
        <RadixCheckbox.Root
          id={id}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          disabled={disabled}
          aria-invalid={!!error}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-border bg-surface transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
            "data-[state=checked]:border-brand-primary data-[state=checked]:bg-brand-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-danger-600",
          )}
        >
          <RadixCheckbox.Indicator>
            <Check className="h-3.5 w-3.5 text-white" />
          </RadixCheckbox.Indicator>
        </RadixCheckbox.Root>
        {label && (
          <label htmlFor={id} className="text-sm text-text-primary">
            {label}
          </label>
        )}
      </div>
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}
