"use client";

import * as RadixTabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

/** Underline-style tabs — Radix under the hood for correct keyboard/focus/ARIA behavior (arrow keys move focus, Home/End jump to ends). */
export function Tabs({ items, defaultValue, value, onValueChange, className }: TabsProps) {
  return (
    <RadixTabs.Root defaultValue={defaultValue ?? items[0]?.value} value={value} onValueChange={onValueChange} className={cn("flex flex-col gap-4", className)}>
      <RadixTabs.List className="flex gap-1 border-b border-border" aria-label="Tabs">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              "relative px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors",
              "hover:text-text-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
              "data-[state=active]:text-brand-700",
              "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-brand-primary after:opacity-0 after:transition-opacity",
              "data-[state=active]:after:opacity-100",
            )}
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value} className="focus-visible:outline-none">
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
