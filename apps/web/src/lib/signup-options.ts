/**
 * How the sign-up and onboarding choices read to a person. The values are
 * stored in capitals (see packages/types enums and signup.ts); every picker
 * and profile reads its words from here. The structure follows BHASKAR's
 * sign-up, see docs/13-signup-questions.md.
 */
import type { ChoiceOption } from "./startup-options";

export const MENTOR_TYPE_LABEL: Record<string, string> = {
  FOUNDER_OPERATOR: "Founder or operator",
  INDUSTRY_EXPERT: "Industry expert",
  INVESTOR: "Investor",
  ACADEMIC: "Academic",
  PROFESSIONAL_ADVISER: "Professional adviser",
};

export const MENTOR_TYPE_HINT: Record<string, string> = {
  FOUNDER_OPERATOR: "You have built or run a company",
  INDUSTRY_EXPERT: "Deep experience in one industry",
  INVESTOR: "You invest, and mentor on the side",
  ACADEMIC: "You teach or research",
  PROFESSIONAL_ADVISER: "CA, lawyer, company secretary or similar",
};

export const MEETING_MODE_LABEL: Record<string, string> = {
  ONLINE: "Online",
  IN_PERSON: "In person",
  BOTH: "Both",
};

export const MENTOR_FEE_TYPE_LABEL: Record<string, string> = {
  FREE: "Free",
  PAID: "Paid",
};

/** Areas a mentor can pick in one tap; anything else can be typed in. Stored as these words. */
export const MENTOR_EXPERTISE_OPTIONS = [
  "Fundraising",
  "Product",
  "Go-to-market",
  "Pricing",
  "Hiring",
  "Finance",
  "Legal and compliance",
  "Technology",
  "Marketing",
  "Sales",
  "Operations",
  "Pitching",
] as const;

export const INVESTOR_TYPE_LABEL: Record<string, string> = {
  ANGEL: "Angel investor",
  VC_FIRM: "Venture capital fund",
  FAMILY_OFFICE: "Family office",
  CORPORATE_VC: "Corporate VC",
  ANGEL_NETWORK: "Angel network",
  ACCELERATOR: "Accelerator fund",
};

/** The investor types an organisation picks from; an individual is an angel. */
export const FIRM_INVESTOR_TYPES = ["VC_FIRM", "FAMILY_OFFICE", "CORPORATE_VC", "ANGEL_NETWORK", "ACCELERATOR"] as const;

export const SEBI_CATEGORY_LABEL: Record<string, string> = {
  AIF_CAT_I: "AIF Category I",
  AIF_CAT_II: "AIF Category II",
  AIF_CAT_III: "AIF Category III",
  ANGEL_FUND: "Angel fund (under AIF Cat I)",
  NOT_REGISTERED: "Not registered with SEBI",
};

/** Cheque sizes an investor picks in one tap, in rupees. `max` of null means "and above". */
export const CHEQUE_SIZE_RANGES: { key: string; label: string; min: number; max: number }[] = [
  { key: "UNDER_10L", label: "Under ₹10 lakh", min: 0, max: 1_000_000 },
  { key: "10L_50L", label: "₹10 to 50 lakh", min: 1_000_000, max: 5_000_000 },
  { key: "50L_2CR", label: "₹50 lakh to 2 crore", min: 5_000_000, max: 20_000_000 },
  { key: "2CR_10CR", label: "₹2 to 10 crore", min: 20_000_000, max: 100_000_000 },
  { key: "ABOVE_10CR", label: "Above ₹10 crore", min: 100_000_000, max: 500_000_000 },
];

export const INCUBATOR_KIND_LABEL: Record<string, string> = {
  INCUBATOR: "Incubator",
  ACCELERATOR: "Accelerator",
};

export const INCUBATOR_HOST_LABEL: Record<string, string> = {
  ACADEMIC: "Academic",
  GOVERNMENT: "Government",
  CORPORATE: "Corporate",
  PRIVATE: "Private",
  NON_PROFIT: "Non-profit",
};

export const INCUBATOR_HOST_HINT: Record<string, string> = {
  ACADEMIC: "Run by a university, IIT, IIM or college",
  GOVERNMENT: "Run by a central or state body",
  CORPORATE: "Run by a company",
  PRIVATE: "Independent, privately funded",
  NON_PROFIT: "Run by a foundation or Section 8 company",
};

export const GOVERNMENT_PROGRAM_LABEL: Record<string, string> = {
  AIM_AIC: "Atal Incubation Centre (AIM)",
  DST_NIDHI_TBI: "DST NIDHI-TBI",
  DBT_BIONEST: "DBT BioNEST (BIRAC)",
  MEITY_TIDE: "MeitY TIDE 2.0",
  SISFS_INCUBATOR: "Startup India Seed Fund incubator",
  STATE_SCHEME: "A state government scheme",
};

export const INSTITUTION_TYPE_LABEL: Record<string, string> = {
  CENTRAL_UNIVERSITY: "Central university",
  STATE_PUBLIC_UNIVERSITY: "State public university",
  STATE_PRIVATE_UNIVERSITY: "State private university",
  DEEMED_UNIVERSITY: "Deemed university",
  INSTITUTE_OF_NATIONAL_IMPORTANCE: "Institute of national importance",
  OPEN_UNIVERSITY: "Open university",
  AUTONOMOUS_COLLEGE: "Autonomous college",
  AFFILIATED_COLLEGE: "Affiliated college",
  STANDALONE_INSTITUTION: "Standalone institution",
  OTHER: "Other",
};

/** Turns a list of stored words into chip options that show the word itself. */
export function plainOptions(values: readonly string[]): ChoiceOption[] {
  return values.map((value) => ({ value, label: value }));
}

/** Chip options with a hint on each, from a label map and a hint map. */
export function hintedOptions<T extends string>(labels: Record<string, string>, hints: Record<string, string>): ChoiceOption<T>[] {
  return Object.entries(labels).map(([value, label]) => ({ value: value as T, label, hint: hints[value] }));
}
