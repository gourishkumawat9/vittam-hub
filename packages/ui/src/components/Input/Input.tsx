import { AlertCircle } from "lucide-react";
import { forwardRef, useId } from "react";

import { cn } from "../../lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

/**
 * Labeled text input with built-in error state. Always renders a real
 * <label htmlFor>, so it's screen-reader correct without callers remembering
 * to wire aria-labelledby themselves.
 *
 * Pass `required` to mark the field visibly. Forms previously gave no signal
 * at all about which fields were mandatory, so a failed submit was the first
 * time anyone found out — the marker is deliberately rendered before that
 * point, not only in the error state.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, required, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
            {required && (
              // aria-hidden because `aria-required` on the input already
              // conveys this to assistive tech; the asterisk would otherwise
              // be announced as stray punctuation mid-label.
              <span aria-hidden="true" className="ml-0.5 text-danger-600">
                *
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-required={required || undefined}
          aria-invalid={!!error}
          aria-describedby={cn(hintId, errorId) || undefined}
          className={cn(
            "h-11 w-full rounded-input border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-secondary transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:border-brand-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-danger-600 focus-visible:ring-danger-600",
            className,
          )}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-text-secondary">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="flex items-center gap-1 text-xs text-danger-600">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
