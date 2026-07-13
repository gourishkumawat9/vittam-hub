"use client";

import { useRef } from "react";

import { cn } from "../../lib/cn";

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
}

/** A row of single-digit boxes that behaves like one field — paste, arrow-key nav, and auto-advance all work. */
export function OtpInput({ length = 6, value, onChange, onComplete, error, disabled, label }: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    const nextValue = next.join("");
    onChange(nextValue);
    if (nextValue.length === length) onComplete?.(nextValue);
  };

  const handleChange = (index: number, rawValue: string) => {
    const digit = rawValue.replace(/[^0-9]/g, "").slice(-1);
    setDigit(index, digit);
    if (digit && index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, length);
    onChange(pasted);
    if (pasted.length === length) onComplete?.(pasted);
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
      <div className="flex gap-2" role="group" aria-label={label ?? "Verification code"}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${index + 1} of ${length}`}
            aria-invalid={!!error}
            className={cn(
              "h-12 w-11 rounded-input border border-border bg-surface text-center font-numeric text-lg font-semibold text-text-primary transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:border-brand-primary",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-danger-600 focus-visible:ring-danger-600",
            )}
          />
        ))}
      </div>
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}
