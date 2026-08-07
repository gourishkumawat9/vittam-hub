"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { cn } from "../../lib/cn";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title: string;
  /** Optional second line — use it for the recovery action, not to restate the title. */
  description?: string;
  variant?: ToastVariant;
  /** Errors stay until dismissed by default; anything else auto-dismisses. */
  durationMs?: number;
}

interface ToastRecord extends ToastOptions {
  id: number;
}

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastVariants = cva(
  "pointer-events-auto relative flex w-full items-start gap-3 rounded-card border bg-surface p-4 shadow-lg",
  {
    variants: {
      variant: {
        success: "border-border",
        error: "border-danger-600/30",
        warning: "border-border",
        info: "border-border",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

const ICON_TONE: Record<ToastVariant, string> = {
  success: "text-success-600",
  error: "text-danger-600",
  warning: "text-warning-600",
  info: "text-brand-primary",
};

interface ToastContextValue {
  /** Show a toast. Returns its id so a caller can dismiss it early. */
  toast: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * App-wide feedback. Every mutation should confirm success or explain
 * failure — an action that silently does nothing is the fastest way to make
 * a product feel broken, and on a platform built around trust between
 * founders and investors it's worse than a visible error.
 *
 * Radix's Toast primitive is doing the accessibility work here: the viewport
 * is an aria-live region so screen readers announce each message, F8 focuses
 * the toast list, and Escape/swipe dismiss.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    // Date.now() alone collides when two toasts fire in the same tick (a
    // Promise.all of mutations, say), and duplicate React keys drop toasts.
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { ...options, id }]);
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}

        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const variant = t.variant ?? "info";
            const Icon = ICONS[variant];
            // Errors persist: they usually require the user to do something,
            // and auto-hiding the only explanation of a failure is hostile.
            const duration = t.durationMs ?? (variant === "error" ? Infinity : 5000);

            return (
              <ToastPrimitive.Root
                key={t.id}
                duration={duration}
                onOpenChange={(open) => {
                  if (!open) dismiss(t.id);
                }}
                asChild
                forceMount
              >
                <motion.li
                  layout
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(toastVariants({ variant }))}
                >
                  <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", ICON_TONE[variant])} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <ToastPrimitive.Title className="text-sm font-medium text-text-primary">{t.title}</ToastPrimitive.Title>
                    {t.description && (
                      <ToastPrimitive.Description className="mt-0.5 text-sm text-text-secondary">
                        {t.description}
                      </ToastPrimitive.Description>
                    )}
                  </div>
                  <ToastPrimitive.Close
                    aria-label="Dismiss notification"
                    className="shrink-0 rounded p-1 text-text-secondary transition-colors hover:bg-background-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  >
                    <X className="h-4 w-4" />
                  </ToastPrimitive.Close>
                </motion.li>
              </ToastPrimitive.Root>
            );
          })}
        </AnimatePresence>

        <ToastPrimitive.Viewport
          className="fixed bottom-0 right-0 z-[60] m-0 flex w-full max-w-sm list-none flex-col gap-2 p-4 outline-none sm:bottom-4 sm:right-4 sm:p-0"
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside a <ToastProvider>");
  return ctx;
}

export type { VariantProps };
