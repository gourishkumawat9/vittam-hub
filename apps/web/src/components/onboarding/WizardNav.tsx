"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

interface WizardNavProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  isFirstStep?: boolean;
  isSubmitting?: boolean;
}

export function WizardNav({ onBack, onNext, nextLabel = "Continue", isFirstStep = false, isSubmitting = false }: WizardNavProps) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirstStep}
        className="inline-flex items-center gap-1.5 rounded-button px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-background-secondary disabled:pointer-events-none disabled:opacity-0"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={isSubmitting}
        className="inline-flex items-center gap-1.5 rounded-button bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
      >
        {nextLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
