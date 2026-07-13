"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useId } from "react";

import { cn } from "../../lib/cn";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  name?: string;
}

/** Single-select dropdown — Radix under the hood for correct keyboard/focus/ARIA behavior. */
export function Select({ label, hint, error, placeholder = "Select…", options, value, onChange, disabled, name }: SelectProps) {
  const id = useId();

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <RadixSelect.Root value={value} onValueChange={onChange} disabled={disabled} name={name}>
        <RadixSelect.Trigger
          id={id}
          aria-invalid={!!error}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-input border border-border bg-surface px-4 text-sm text-text-primary transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:border-brand-primary",
            "disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-text-secondary",
            error && "border-danger-600 focus-visible:ring-danger-600",
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown className="h-4 w-4 text-text-secondary" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={6}
            className="z-dropdown max-h-72 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-card border border-border bg-surface shadow-lg"
          >
            <RadixSelect.Viewport className="p-1">
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  className="flex cursor-pointer items-center justify-between rounded-sm px-3 py-2 text-sm text-text-primary outline-none data-[highlighted]:bg-background-secondary"
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator>
                    <Check className="h-3.5 w-3.5 text-brand-primary" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {hint && !error && <p className="text-xs text-text-secondary">{hint}</p>}
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}
