import { MemberPersona, MentorFeeType, UserRole } from "./enums";

/**
 * The sign-up structure, modelled on BHASKAR's (Startup India's registry):
 * you first say whether you're joining as an individual or for an
 * organisation, then which kind. Each choice is a persona; several share one
 * role, so the dashboards stay the same five. See docs/13-signup-questions.md.
 */
export const PERSONA_ROLE = {
  [MemberPersona.STARTUP_FOUNDER]: UserRole.FOUNDER,
  [MemberPersona.EXPLORER]: UserRole.FOUNDER,
  [MemberPersona.STUDENT]: UserRole.FOUNDER,
  [MemberPersona.MENTOR]: UserRole.MENTOR,
  [MemberPersona.INDIVIDUAL_INVESTOR]: UserRole.INVESTOR,
  [MemberPersona.INVESTMENT_FIRM]: UserRole.INVESTOR,
  [MemberPersona.INCUBATOR]: UserRole.INCUBATOR,
  [MemberPersona.ACCELERATOR]: UserRole.INCUBATOR,
  [MemberPersona.INSTITUTION]: UserRole.UNIVERSITY,
} as const satisfies Record<MemberPersona, UserRole>;

export type PersonaGroup = "INDIVIDUAL" | "ORGANISATION";

export const PERSONA_GROUP: Record<MemberPersona, PersonaGroup> = {
  STARTUP_FOUNDER: "INDIVIDUAL",
  EXPLORER: "INDIVIDUAL",
  STUDENT: "INDIVIDUAL",
  MENTOR: "INDIVIDUAL",
  INDIVIDUAL_INVESTOR: "INDIVIDUAL",
  INVESTMENT_FIRM: "ORGANISATION",
  INCUBATOR: "ORGANISATION",
  ACCELERATOR: "ORGANISATION",
  INSTITUTION: "ORGANISATION",
};

/** True when the persona is someone signing up on behalf of an organisation, who is then asked for their role there. */
export function isOrganisationPersona(persona: MemberPersona | null | undefined): boolean {
  return !!persona && PERSONA_GROUP[persona] === "ORGANISATION";
}

/** The persona an account gets when it signed up without choosing one (older clients, social sign-in). */
export const DEFAULT_PERSONA_FOR_ROLE: Partial<Record<UserRole, MemberPersona>> = {
  FOUNDER: MemberPersona.STARTUP_FOUNDER,
  MENTOR: MemberPersona.MENTOR,
  INVESTOR: MemberPersona.INDIVIDUAL_INVESTOR,
  INCUBATOR: MemberPersona.INCUBATOR,
  UNIVERSITY: MemberPersona.INSTITUTION,
};

/** Country codes offered beside the mobile number; India first and preselected. */
export const MOBILE_COUNTRY_CODES = ["+91", "+1", "+44", "+61", "+65", "+971"] as const;

/** Session lengths a mentor can offer, in minutes. */
export const MENTOR_SESSION_LENGTHS = [30, 45, 60, 90] as const;

/**
 * Government incubation schemes an incubator can say it runs under
 * (self-declared, BHASKAR's incubator form asks the same). Stored as these keys.
 */
export const GOVERNMENT_INCUBATOR_PROGRAMS = [
  "AIM_AIC",
  "DST_NIDHI_TBI",
  "DBT_BIONEST",
  "MEITY_TIDE",
  "SISFS_INCUBATOR",
  "STATE_SCHEME",
] as const;
export type GovernmentIncubatorProgram = (typeof GOVERNMENT_INCUBATOR_PROGRAMS)[number];

/** The kinds of higher-education institution AISHE and BHASKAR use. Stored in UniversityProfile.affiliationType. */
export const INSTITUTION_TYPES = [
  "CENTRAL_UNIVERSITY",
  "STATE_PUBLIC_UNIVERSITY",
  "STATE_PRIVATE_UNIVERSITY",
  "DEEMED_UNIVERSITY",
  "INSTITUTE_OF_NATIONAL_IMPORTANCE",
  "OPEN_UNIVERSITY",
  "AUTONOMOUS_COLLEGE",
  "AFFILIATED_COLLEGE",
  "STANDALONE_INSTITUTION",
  "OTHER",
] as const;
export type InstitutionType = (typeof INSTITUTION_TYPES)[number];

/** SEBI registration an investor can declare (self-declared until checked against SEBI's register). */
export const SEBI_CATEGORIES = ["AIF_CAT_I", "AIF_CAT_II", "AIF_CAT_III", "ANGEL_FUND", "NOT_REGISTERED"] as const;
export type SebiCategory = (typeof SEBI_CATEGORIES)[number];

/**
 * How a mentor's fee reads on their profile and in the directory, worked out
 * from what they chose so it is always in one format: "Free", or
 * "₹2,000 per 60-min session · first session free".
 */
export function mentorFeeLabel(fee: {
  feeType: MentorFeeType | null | undefined;
  sessionFeeAmount?: number | null;
  sessionLengthMinutes?: number | null;
  firstSessionFree?: boolean | null;
}): string | null {
  if (fee.feeType === MentorFeeType.FREE) return "Free";
  if (fee.feeType !== MentorFeeType.PAID || !fee.sessionFeeAmount) return null;
  const amount = `₹${fee.sessionFeeAmount.toLocaleString("en-IN")}`;
  const per = fee.sessionLengthMinutes ? `per ${fee.sessionLengthMinutes}-min session` : "per session";
  return `${amount} ${per}${fee.firstSessionFree ? " · first session free" : ""}`;
}
