"use client";

import { Drawer, ProgressBar, Skeleton } from "@vittamhub/ui";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Cloud, CloudOff, ListTree, Loader2 } from "lucide-react";
import Link from "next/link";
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
  /** The profile is already live and this visit edits it: every step is open, and there is a way back out. */
  isEditing?: boolean;
  /** Where "Back to dashboard" goes while editing. */
  exitHref?: string;
  /** False until the saved answers have loaded for the person signed in. */
  ready?: boolean;
  /** The saved answers couldn't be loaded. */
  failed?: boolean;
  onRetry?: () => void;
  /** While editing: something has been changed that isn't live yet. */
  pendingEdits?: boolean;
  onDiscardEdits?: () => void;
  isDiscarding?: boolean;
  children: ReactNode;
}

function AutosaveIndicator({ status, isEditing }: { status: AutosaveStatus; isEditing: boolean }) {
  if (status === "idle") return null;
  // On a live profile "Saved" would read as "published". The banner below says what state the changes are in.
  if (isEditing && status === "saved") return null;
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
  allOpen = false,
  className,
}: Pick<WizardShellProps, "steps" | "currentStepIndex" | "onStepSelect"> & { onNavigate?: () => void; allOpen?: boolean; className?: string }) {
  return (
    <nav aria-label="Steps" className={cn("flex flex-col gap-1", className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isComplete = !allOpen && index < currentStepIndex;
        // While onboarding, a later step opens only by getting there. While editing, any step can be opened.
        const isLocked = !onStepSelect || (!allOpen && index > currentStepIndex);
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => {
              onStepSelect?.(index);
              onNavigate?.();
            }}
            disabled={isLocked}
            aria-current={isActive ? "step" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-button px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
              isActive ? "bg-brand-100 font-semibold text-brand-700" : "text-text-secondary hover:bg-background-secondary",
              isLocked && !isActive && "cursor-not-allowed opacity-50",
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
export function WizardShell({
  steps,
  currentStepIndex,
  onStepSelect,
  autosaveStatus = "idle",
  isEditing = false,
  exitHref,
  ready = true,
  failed = false,
  onRetry,
  pendingEdits = false,
  onDiscardEdits,
  isDiscarding = false,
  children,
}: WizardShellProps) {
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  const [stepsOpen, setStepsOpen] = useState(false);
  const currentStep = steps[currentStepIndex];
  const lastStepIndex = steps.length - 1;
  const onLastStep = currentStepIndex === lastStepIndex;

  return (
    <div className="min-h-screen bg-background-secondary">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <AutosaveIndicator status={autosaveStatus} isEditing={isEditing} />
            {isEditing && exitHref && (
              <Link
                href={exitHref}
                className="flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-background-secondary"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Back to dashboard</span>
                <span className="sm:hidden">Back</span>
              </Link>
            )}
            {steps.length > 1 && (
              <button
                type="button"
                onClick={() => setStepsOpen(true)}
                className="flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-background-secondary lg:hidden"
              >
                <ListTree className="h-3.5 w-3.5" aria-hidden="true" />
                Steps
              </button>
            )}
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-4 sm:px-6">
          <ProgressBar value={progress} label={`Step ${currentStepIndex + 1} of ${steps.length}: ${currentStep?.label}`} />
        </div>
      </header>

      {/* Editing a live profile: say plainly whether what's on screen is public yet, and how to make it so. */}
      {isEditing && ready && (
        <div role="status" className={cn("border-b", pendingEdits ? "border-warning-200 bg-warning-50" : "border-brand-200 bg-brand-50")}>
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
            <p className="text-sm text-text-primary">
              {pendingEdits ? (
                <>
                  <span className="font-semibold">You have changes that aren&apos;t live yet.</span>{" "}
                  {onLastStep ? "Save them below." : "Save them on the last step."}
                </>
              ) : (
                <>
                  <span className="font-semibold">Editing your live profile.</span> Change what you need on any step, then save on the
                  last one.
                </>
              )}
            </p>
            {pendingEdits && (
              <div className="flex items-center gap-2">
                {onDiscardEdits && (
                  <button
                    type="button"
                    onClick={onDiscardEdits}
                    disabled={isDiscarding}
                    className="rounded-button px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface disabled:opacity-60"
                  >
                    {isDiscarding ? "Discarding…" : "Discard changes"}
                  </button>
                )}
                {!onLastStep && onStepSelect && (
                  <button
                    type="button"
                    onClick={() => onStepSelect(lastStepIndex)}
                    className="rounded-button bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    {steps.length > 2 ? "Review and save" : "Continue to save"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Drawer open={stepsOpen} onOpenChange={setStepsOpen} title="Steps">
        <StepNav
          steps={steps}
          currentStepIndex={currentStepIndex}
          onStepSelect={onStepSelect}
          onNavigate={() => setStepsOpen(false)}
          allOpen={isEditing}
          className="p-4"
        />
      </Drawer>

      <div className="mx-auto flex max-w-5xl gap-8 px-4 py-6 sm:px-6 sm:py-10">
        <StepNav
          steps={steps}
          currentStepIndex={currentStepIndex}
          onStepSelect={onStepSelect}
          allOpen={isEditing}
          className="hidden w-56 shrink-0 lg:flex"
        />

        <motion.main
          key={ready ? currentStepIndex : "loading"}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="min-w-0 flex-1 rounded-card border border-border bg-surface p-5 shadow-sm sm:p-8"
        >
          {failed ? (
            <div className="flex flex-col items-start gap-3 py-6">
              <h2 className="font-heading text-lg font-semibold text-text-primary">Your answers didn&apos;t load</h2>
              <p className="text-sm text-text-secondary">Nothing is lost. Check your connection and try again.</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-button border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-background-secondary"
                >
                  Try again
                </button>
              )}
            </div>
          ) : ready ? (
            children
          ) : (
            <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading your answers">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
        </motion.main>
      </div>
    </div>
  );
}
