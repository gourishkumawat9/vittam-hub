"use client";

import { getPasswordStrength } from "@vittamhub/utils";
import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useId, useState } from "react";

import { cn } from "../../lib/cn";

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  hint?: string;
  error?: string;
  /** Renders the live strength meter below the field — turn on for registration/reset, off for plain login. */
  showStrength?: boolean;
}

const STRENGTH_COLOR: Record<string, string> = {
  weak: "bg-danger-600",
  fair: "bg-warning-500",
  good: "bg-info-500",
  strong: "bg-success-600",
};

/** Password field with a show/hide toggle and an optional live strength meter, backed by the same policy the server enforces (packages/types `passwordSchema`). */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, hint, error, showStrength = false, id, value, onChange, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const stringValue = typeof value === "string" ? value : "";
    const strength = showStrength ? getPasswordStrength(stringValue) : null;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            value={value}
            onChange={onChange}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={cn(
              "h-11 w-full rounded-input border border-border bg-surface px-4 pr-11 text-sm text-text-primary placeholder:text-text-secondary transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:border-brand-primary",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-danger-600 focus-visible:ring-danger-600",
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-text-secondary hover:text-text-primary"
            aria-label={visible ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {strength && stringValue.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((step) => (
                <span
                  key={step}
                  className={cn(
                    "h-1 flex-1 rounded-full bg-border transition-colors",
                    step < strength.score && STRENGTH_COLOR[strength.strength],
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-text-secondary">{strength.label} password</span>
          </div>
        )}

        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-text-secondary">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-danger-600">
            {error}
          </p>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
