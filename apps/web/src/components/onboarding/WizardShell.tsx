"use client";

import { ProgressBar } from "@vittamhub/ui";
import { motion } from "framer-motion";
import { Check, Cloud, CloudOff, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { Logo } from "@/components/Logo";
import type { AutosaveStatus } from "@/hooks/useAutosave";
import { cn } from "@/lib/utils";

export interface WizardStepMeta {
  id: string;
  label: string;
}

interface WizardShellProps {
  steps: WizardStepMeta[];
  currentStepIndex: number;
  onStepSelect?: (index: number) => void;
  autosaveStatus?: AutosaveStatus;
  children: ReactNode;
}

function AutosaveIndicator({ status }: { status: AutosaveStatus }) {
  if (status === "idle") return null;
  return (
    <span className="flex items-center gap-1.5 text-xs text-text-secondary">
      {status === "saving" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
        </>
      )}
      {status === "saved" && (
        <>
          <Cloud className="h-3.5 w-3.5 text-success-600" /> Saved
        </>
      )}
      {status === "error" && (
        <>
          <CloudOff className="h-3.5 w-3.5 text-danger-600" /> Couldn&apos;t save — retrying
        </>
      )}
    </span>
  );
}

/** Shared chrome for every onboarding wizard (Startup's 10 steps, and any shorter role flow) — progress bar, step list, autosave status. */
export function WizardShell({ steps, currentStepIndex, onStepSelect, autosaveStatus = "idle", children }: WizardShellProps) {
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Logo />
          <AutosaveIndicator status={autosaveStatus} />
        </div>
        <div className="mx-auto max-w-5xl px-6 pb-4">
          <ProgressBar value={progress} label={`Step ${currentStepIndex + 1} of ${steps.length}: ${steps[currentStepIndex]?.label}`} />
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl gap-8 px-6 py-10">
        <nav aria-label="Onboarding steps" className="hidden w-56 shrink-0 flex-col gap-1 lg:flex">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isComplete = index < currentStepIndex;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepSelect?.(index)}
                disabled={!onStepSelect || index > currentStepIndex}
                className={cn(
                  "flex items-center gap-2.5 rounded-button px-3 py-2 text-left text-sm transition-colors",
                  isActive ? "bg-brand-100 font-semibold text-brand-700" : "text-text-secondary hover:bg-background-secondary",
                  index > currentStepIndex && "cursor-not-allowed opacity-50",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    isComplete ? "bg-success-600 text-white" : isActive ? "bg-brand-primary text-white" : "bg-border text-text-secondary",
                  )}
                >
                  {isComplete ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                {step.label}
              </button>
            );
          })}
        </nav>

        <motion.main
          key={currentStepIndex}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="min-w-0 flex-1 rounded-card border border-border bg-surface p-6 shadow-sm sm:p-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
