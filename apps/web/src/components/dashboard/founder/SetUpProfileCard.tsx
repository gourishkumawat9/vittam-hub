"use client";

import { useOnboardingState } from "@vittamhub/api-client";
import { personalDetailsInputSchema, startupInfoStepSchema } from "@vittamhub/types";
import { Button, Card, ProgressBar, Skeleton } from "@vittamhub/ui";
import { CheckCircle2, Circle, Rocket } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** What a published startup profile opens up. Each line is something the dashboard or the API really gates on it. */
const UNLOCKS = [
  "Send connect requests to investors",
  "Let investors find your startup in Discover and search",
  "Get investor matches, a Trust Score and profile analytics",
];

/**
 * Shown on the founder dashboard until the startup profile is published.
 *
 * A founder reaches the dashboard straight after signing up, so this card is
 * where the profile gets started and picked up again. It reads the wizard's
 * autosaved draft to show how far they are. Only "About you" and "Your
 * startup" are needed to publish; every other section can be added afterwards.
 */
export function SetUpProfileCard() {
  const { data: onboarding, isLoading } = useOnboardingState();
  const draft = onboarding?.draft ?? {};

  const steps = [
    {
      label: "About you",
      hint: "Your name, mobile number and city",
      done: personalDetailsInputSchema.safeParse(draft.personalDetails).success,
    },
    {
      label: "Your startup",
      hint: "Name, one line pitch, what you do, stage, industry and where you're based",
      done: startupInfoStepSchema.safeParse(draft.startupInfo).success,
    },
    { label: "Review and publish", hint: "Check it over and sign. You can edit anything later.", done: false },
  ];
  const doneCount = steps.filter((step) => step.done).length;
  const started = Object.keys(draft).length > 0;
  const readyToPublish = steps[0]!.done && steps[1]!.done;
  const cta = readyToPublish ? "Review and publish" : started ? "Continue your profile" : "Set up your profile";

  return (
    <Card className="flex flex-col gap-6 border-brand-200 bg-gradient-to-br from-brand-50 to-surface dark:from-background-secondary lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 flex-col gap-4 lg:max-w-xl">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100">
            <Rocket className="h-5 w-5 text-brand-700" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="title-3">Set up your startup profile</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Add your startup&apos;s details whenever you like. Every answer saves as you type, so you can stop and come back at any
              point.
            </p>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <ol className="flex flex-col gap-2.5" aria-label="Steps to publish your startup profile">
            {steps.map((step) => (
              <li key={step.label} className="flex items-start gap-2.5">
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
                )}
                <div className="min-w-0">
                  <p className={cn("text-sm font-medium", step.done ? "text-text-secondary line-through" : "text-text-primary")}>
                    {step.label}
                    <span className="sr-only">{step.done ? " (done)" : " (to do)"}</span>
                  </p>
                  <p className="text-xs text-text-secondary">{step.hint}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        <p className="text-xs text-text-secondary">
          Product, traction, team, funding, market and documents are optional. Add them now or after you publish.
        </p>
      </div>

      <div className="flex w-full flex-col gap-4 rounded-card border border-border bg-surface p-4 lg:w-80 lg:shrink-0">
        <ProgressBar value={(doneCount / steps.length) * 100} label={`${doneCount} of ${steps.length} steps done`} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Publishing unlocks</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {UNLOCKS.map((line) => (
              <li key={line} className="flex items-start gap-2 text-xs text-text-primary">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <Button asChild className="w-full">
          <Link href="/onboarding/founder">{cta}</Link>
        </Button>
      </div>
    </Card>
  );
}
