import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Terms",
  description: "The rules for using VittamHub, in plain words.",
};

// The rules the platform already enforces, plus what a badge does and doesn't mean. The owner's full Terms of Service replace this.
const SECTIONS: LegalSection[] = [
  {
    title: "Your account",
    body: (
      <ul>
        <li>One person per account. Give your real name and true details about yourself and your organisation.</li>
        <li>Keep your password to yourself. You can see and sign out every device under Settings.</li>
        <li>You can delete your account at any time under Settings.</li>
      </ul>
    ),
  },
  {
    title: "Reaching investors",
    body: (
      <ul>
        <li>
          Founders reach investors only through a connect request: a short introduction, the startup&apos;s details and, if you like, a pitch
          deck. The free plan includes a set number of requests each month, shown on your dashboard.
        </li>
        <li>An investor can accept, decline or ignore a request. Messages, documents and meetings open only after they accept.</li>
      </ul>
    ),
  },
  {
    title: "What you must not do",
    body: (
      <ul>
        <li>Pretend to be someone else, or another company or fund.</li>
        <li>Upload documents that aren&apos;t yours or that you aren&apos;t allowed to share.</li>
        <li>Post anything unlawful, misleading or abusive, or send people unwanted messages.</li>
        <li>Try to get around the platform&apos;s limits, its security or its automated checks.</li>
      </ul>
    ),
  },
  {
    title: "What you post",
    body: (
      <p>
        What you add stays yours. By adding it you let VittamHub show it on the platform, to the people your visibility settings allow.
        Content that breaks these rules can be removed.
      </p>
    ),
  },
  {
    title: "What a badge means",
    body: (
      <>
        <p>
          Trust Scores and the Verified badge are worked out automatically from the documents and details a profile has added. They are
          not an endorsement and not a check by a person. VittamHub does not give investment advice and does not vet any startup or
          investor: do your own checks before you invest or accept money.
        </p>
      </>
    ),
  },
  {
    title: "Demo accounts",
    body: (
      <p>
        Demo accounts are shared logins for trying the platform. They only ever see each other, and they are reset from time to time, so
        don&apos;t put anything real or private in one.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="The rules, in plain words"
      intro="How VittamHub works and what everyone who uses it agrees to."
      updated="November 2026"
      sections={SECTIONS}
    />
  );
}
