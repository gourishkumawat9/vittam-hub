import { SectionHeading } from "./SectionHeading";

export interface Step {
  title: string;
  description: string;
}

const HOME_STEPS: Step[] = [
  { title: "Create your profile", description: "Pick your role and set up your profile in a few minutes. It's free." },
  {
    title: "Get verified automatically",
    description: "Your verification status updates on its own as you add documents and details. There's no review queue to wait in.",
  },
  { title: "Get discovered", description: "Appear in discovery and the directories, where the right people filter for you." },
  { title: "Connect", description: "Send or answer connect requests. Chat and meetings open once a request is accepted." },
];

/** Numbered steps in a row, each under a thin blue rule. Used on the home page and every audience page. */
export function StepsRow({ steps }: { steps: Step[] }) {
  return (
    <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {steps.map((step, index) => (
        <li key={step.title} className="flex flex-col gap-3 border-t-2 border-brand-primary pt-5">
          <span className="font-numeric text-sm font-semibold text-brand-primary">Step {index + 1}</span>
          <h3 className="font-heading text-lg font-bold text-text-primary">{step.title}</h3>
          <p className="text-sm leading-relaxed text-text-secondary">{step.description}</p>
        </li>
      ))}
    </ol>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 border-y border-border bg-background-secondary">
      <div className="mx-auto max-w-content px-6 py-20 lg:py-24">
        <SectionHeading eyebrow="How it works" title="From sign-up to your first connection in four steps" />
        <div className="mt-12">
          <StepsRow steps={HOME_STEPS} />
        </div>
      </div>
    </section>
  );
}
