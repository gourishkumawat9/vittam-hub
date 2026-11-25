import { Card } from "@vittamhub/ui";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

export interface StartStep {
  title: string;
  hint: string;
  href: string;
  cta: string;
  done: boolean;
}

/**
 * A short "start here" list for a new member, in place of empty panels.
 * Done steps stay visible, ticked, so progress reads at a glance.
 */
export function StartHere({ title = "Start here", steps }: { title?: string; steps: StartStep[] }) {
  const done = steps.filter((step) => step.done).length;
  return (
    <Card className="flex flex-col gap-4 border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-950/40">
      <div className="flex items-center justify-between gap-3">
        <h2 className="title-3">{title}</h2>
        <span className="caption-4 font-numeric">
          {done} of {steps.length} done
        </span>
      </div>
      <ol className="grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title}>
            <Link
              href={step.href}
              className="group flex h-full flex-col gap-2 rounded-button bg-surface p-4 transition-transform duration-300 ease-base hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="flex items-center gap-2">
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success-600" aria-label="Done" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-brand-400" aria-label={`Step ${index + 1}`} />
                )}
                <span className={step.done ? "body-5 text-text-secondary line-through decoration-1" : "body-4 text-text-primary"}>{step.title}</span>
              </span>
              <span className="caption-5">{step.hint}</span>
              {!step.done && (
                <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
                  {step.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 ease-base group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
