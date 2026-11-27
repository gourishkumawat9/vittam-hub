"use client";

import { Loader2, Upload } from "@vittamhub/ui/icons";

import { cn } from "@/lib/utils";

/** A file picker styled as a button, for one document type. */
export function UploadButton({
  label,
  busy,
  disabled,
  onFile,
  variant = "secondary",
}: {
  label: string;
  busy: boolean;
  disabled: boolean;
  onFile: (file: File | undefined) => void;
  variant?: "primary" | "secondary";
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-button px-3 py-2 text-sm font-semibold transition-colors focus-within:ring-2 focus-within:ring-brand-primary",
        variant === "primary"
          ? "bg-brand-primary text-white hover:bg-brand-700"
          : "border border-border bg-surface text-text-primary hover:bg-background-secondary",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
      {label}
      <input
        type="file"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Cleared so the same file can be chosen again after a failed try.
          e.target.value = "";
          onFile(file);
        }}
      />
    </label>
  );
}
