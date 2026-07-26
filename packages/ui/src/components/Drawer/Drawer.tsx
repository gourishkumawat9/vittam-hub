"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { motionVariants } from "@vittamhub/tokens";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * Off-canvas panel for mobile navigation — same Radix Dialog primitive (overlay,
 * focus trap, Escape/outside-click dismissal) as `Dialog`, but slides in from the
 * left edge instead of centering, for nav-drawer use cases.
 */
export function Drawer({ open, onOpenChange, title, children, className }: DrawerProps) {
  const reduceMotion = useReducedMotion();
  const overlayVariant = reduceMotion ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : motionVariants.drawerOverlay;
  const panelVariant = reduceMotion ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : motionVariants.drawerSlide;

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                initial={overlayVariant.initial}
                animate={overlayVariant.animate}
                exit={overlayVariant.exit}
                className="fixed inset-0 z-modal bg-slate-950/50"
              />
            </RadixDialog.Overlay>
            <RadixDialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                initial={panelVariant.initial}
                animate={panelVariant.animate}
                exit={panelVariant.exit}
                className={cn(
                  "fixed inset-y-0 left-0 z-modal flex w-[85vw] max-w-xs flex-col border-r border-border bg-surface shadow-lg focus:outline-none",
                  className,
                )}
              >
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
                  <RadixDialog.Title className="font-heading text-sm font-semibold text-text-primary">{title}</RadixDialog.Title>
                  <RadixDialog.Close aria-label="Close menu" className="shrink-0 rounded-full p-1.5 text-text-secondary hover:bg-background-secondary">
                    <X className="h-4 w-4" />
                  </RadixDialog.Close>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
              </motion.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
