import { DocumentType, FundingStatus, MemberPersona, RegistrationStatus, RevenueStatus } from "./enums";

/**
 * Which documents a founder is asked for, by the kind of startup it is. A
 * student with an idea and a registered startup raising a Series A have very
 * different papers, so the founder wizard's Documents step, the profile
 * strength questions and the verification requirements all read this one
 * plan instead of asking everyone for everything.
 *
 * The kinds follow how BHASKAR and the Startup India scheme sort startups:
 * not registered yet, registering, registered, and registered with revenue or
 * institutional funding. Every document stays optional and is collected for
 * future automated checks (CLAUDE.md §6 and §7); nothing here is reviewed by
 * a person.
 */
export const StartupDocumentTier = {
  /** Idea or early work, no company yet. Students and first-time founders start here. */
  NOT_REGISTERED: "NOT_REGISTERED",
  /** Incorporation has been filed but the certificate isn't in yet. */
  REGISTERING: "REGISTERING",
  /** A registered company before steady revenue or institutional funding. */
  REGISTERED: "REGISTERED",
  /** A registered company with recurring revenue or a seed round or later. */
  GROWTH: "GROWTH",
} as const;
export type StartupDocumentTier = (typeof StartupDocumentTier)[keyof typeof StartupDocumentTier];

export interface StartupDocumentPlan {
  tier: StartupDocumentTier;
  /** How the step names the founder's kind of startup: "Not registered yet". */
  title: string;
  /** Asked first: the documents that matter most at this point. */
  key: DocumentType[];
  /** Offered under "More documents", to add when the founder has them. */
  more: DocumentType[];
}

const GROWTH_REVENUE = new Set<string>([RevenueStatus.RECURRING, RevenueStatus.PROFITABLE]);
const GROWTH_FUNDING = new Set<string>([
  FundingStatus.SEED,
  FundingStatus.SERIES_A,
  FundingStatus.SERIES_B,
  FundingStatus.SERIES_C_PLUS,
  FundingStatus.PE,
  FundingStatus.PUBLIC,
]);

const PLANS: Record<StartupDocumentTier, Omit<StartupDocumentPlan, "tier">> = {
  NOT_REGISTERED: {
    title: "Not registered yet",
    key: [DocumentType.PITCH_DECK, DocumentType.GOVERNMENT_ID],
    more: [DocumentType.TRADEMARK, DocumentType.PATENT],
  },
  REGISTERING: {
    title: "Registration in progress",
    key: [DocumentType.PITCH_DECK, DocumentType.GOVERNMENT_ID],
    more: [DocumentType.INCORPORATION_CERTIFICATE, DocumentType.PAN, DocumentType.TRADEMARK, DocumentType.PATENT],
  },
  REGISTERED: {
    title: "Registered company",
    key: [DocumentType.PITCH_DECK, DocumentType.INCORPORATION_CERTIFICATE, DocumentType.DPIIT_RECOGNITION],
    more: [
      DocumentType.PAN,
      DocumentType.GST,
      DocumentType.UDYAM_REGISTRATION,
      DocumentType.TRADEMARK,
      DocumentType.PATENT,
      DocumentType.GOVERNMENT_ID,
      DocumentType.DIGITAL_SIGNATURE,
    ],
  },
  GROWTH: {
    title: "Registered, with revenue or funding",
    key: [DocumentType.PITCH_DECK, DocumentType.INCORPORATION_CERTIFICATE, DocumentType.FINANCIAL_STATEMENT],
    more: [
      DocumentType.DPIIT_RECOGNITION,
      DocumentType.PAN,
      DocumentType.GST,
      DocumentType.UDYAM_REGISTRATION,
      DocumentType.TRADEMARK,
      DocumentType.PATENT,
      DocumentType.GOVERNMENT_ID,
      DocumentType.DIGITAL_SIGNATURE,
    ],
  },
};

export interface StartupKind {
  registrationStatus?: string | null;
  revenueStatus?: string | null;
  fundingStatus?: string | null;
  persona?: MemberPersona | string | null;
}

/** The kind of startup, from the answers in "Your startup". No answer yet reads as not registered. */
export function startupDocumentTier(kind: StartupKind): StartupDocumentTier {
  if (kind.registrationStatus === RegistrationStatus.IN_PROGRESS) return StartupDocumentTier.REGISTERING;
  if (kind.registrationStatus !== RegistrationStatus.REGISTERED) return StartupDocumentTier.NOT_REGISTERED;
  const growing = GROWTH_REVENUE.has(kind.revenueStatus ?? "") || GROWTH_FUNDING.has(kind.fundingStatus ?? "");
  return growing ? StartupDocumentTier.GROWTH : StartupDocumentTier.REGISTERED;
}

/** The documents to ask this founder for. A student founder is also asked for a student ID. */
export function startupDocumentPlan(kind: StartupKind): StartupDocumentPlan {
  const tier = startupDocumentTier(kind);
  const plan = PLANS[tier];
  const key = [...plan.key];
  const more = [...plan.more];
  if (kind.persona === MemberPersona.STUDENT) {
    // Before a company exists, the student ID is what opens campus and student-only programmes.
    if (tier === StartupDocumentTier.NOT_REGISTERED || tier === StartupDocumentTier.REGISTERING) key.push(DocumentType.STUDENT_ID);
    else more.push(DocumentType.STUDENT_ID);
  }
  return { tier, title: plan.title, key, more };
}
