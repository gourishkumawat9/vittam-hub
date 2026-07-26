"use client";

import * as RadixAccordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

export interface AccordionItem {
  value: string;
  question: string;
  answer: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

/** Single-open FAQ-style accordion — Radix under the hood, height-animated via CSS custom property + the existing motion timing scale. */
export function Accordion({ items, className }: AccordionProps) {
  return (
    <RadixAccordion.Root type="single" collapsible className={cn("flex flex-col divide-y divide-border rounded-card border border-border", className)}>
      {items.map((item) => (
        <RadixAccordion.Item key={item.value} value={item.value} className="overflow-hidden">
          <RadixAccordion.Header>
            <RadixAccordion.Trigger
              className={cn(
                "group flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-medium text-text-primary transition-colors",
                "hover:bg-background-secondary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary",
              )}
            >
              {item.question}
              <ChevronDown className="h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </RadixAccordion.Trigger>
          </RadixAccordion.Header>
          <RadixAccordion.Content className="overflow-hidden text-sm text-text-secondary data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="px-4 pb-4">{item.answer}</div>
          </RadixAccordion.Content>
        </RadixAccordion.Item>
      ))}
    </RadixAccordion.Root>
  );
}
