"use client";

import { X } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "../../lib/cn";

export interface TagsInputProps {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  value: string[];
  onChange: (value: string[]) => void;
  maxTags?: number;
}

/** Freeform multi-value entry (skills, industries, open roles, ...) — type + Enter/comma to add, Backspace on empty input to remove the last tag. */
export function TagsInput({ label, hint, error, placeholder = "Type and press Enter…", value, onChange, maxTags }: TagsInputProps) {
  const [draft, setDraft] = useState("");
  const id = useId();

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) return;
    if (maxTags && value.length >= maxTags) return;
    onChange([...value, tag]);
    setDraft("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draft);
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-input border border-border bg-surface px-3 py-2 transition-colors focus-within:ring-2 focus-within:ring-brand-primary focus-within:border-brand-primary",
          error && "border-danger-600 focus-within:ring-danger-600",
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
              className="rounded-full hover:bg-brand-200"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[8rem] flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
        />
      </div>
      {hint && !error && <p className="text-xs text-text-secondary">{hint}</p>}
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}
