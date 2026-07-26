"use client";

import { Drawer, ProgressBar } from "@vittamhub/ui";
import { motion } from "framer-motion";
import { Check, Cloud, CloudOff, ListTree, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

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
          <CloudOff className="h-3.5 w-3.5 text-danger-600" /> Couldn&apos;t save, retrying
        </>
      )}
    </span>
  );
}

function StepNav({
  steps,
  currentStepIndex,
  onStepSelect,
  onNavigate,
  className,
}: Pick<WizardShellProps, "steps" | "currentStepIndex" | "onStepSelect"> & { onNavigate?: () => void; className?: string }) {
  return (
    <nav aria-label="Onboarding steps" className={cn("flex flex-col gap-1", className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isComplete = index < currentStepIndex;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => {
              onStepSelect?.(index);
              onNavigate?.();
            }}
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
  );
}

/** Shared chrome for every onboarding wizard (Startup's 10 steps, and any shorter role flow) — progress bar, step list, autosave status. */
export function WizardShell({ steps, currentStepIndex, onStepSelect, autosaveStatus = "idle", children }: WizardShellProps) {
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  const [stepsOpen, setStepsOpen] = useState(false);
  const currentStep = steps[currentStepIndex];

  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <AutosaveIndicator status={autosaveStatus} />
            <button
              type="button"
              onClick={() => setStepsOpen(true)}
              className="flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-background-secondary lg:hidden"
            >
              <ListTree className="h-3.5 w-3.5" />
              Steps
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-6 pb-4">
          <ProgressBar value={progress} label={`Step ${currentStepIndex + 1} of ${steps.length}: ${currentStep?.label}`} />
        </div>
      </header>

      <Drawer open={stepsOpen} onOpenChange={setStepsOpen} title="Onboarding steps">
        <StepNav
          steps={steps}
          currentStepIndex={currentStepIndex}
          onStepSelect={onStepSelect}
          onNavigate={() => setStepsOpen(false)}
          className="p-4"
        />
      </Drawer>

      <div className="mx-auto flex max-w-5xl gap-8 px-6 py-10">
        <StepNav
          steps={steps}
          currentStepIndex={currentStepIndex}
          onStepSelect={onStepSelect}
          className="hidden w-56 shrink-0 lg:flex"
        />

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
