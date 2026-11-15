import { z } from "zod";

import { OnboardingStatus } from "./enums";

/**
 * Generic autosave payload — one endpoint (`PATCH /v1/onboarding/draft`) for
 * every role. `section` names a key in the role-specific draft shape (e.g.
 * "startupInfo", "product"); `data` is merged into the stored JSON draft
 * rather than replacing it, so saving step 3 never clobbers step 2's answers.
 * See docs/11-onboarding-architecture.md.
 */
/**
 * Every section a wizard saves. The draft is free-form JSON, so the section
 * name is the only thing that bounds it: before this list, any string was
 * accepted as a key and each new one added up to a request's worth of data to
 * the stored draft, with no ceiling.
 */
export const ONBOARDING_DRAFT_SECTIONS = [
  "personalDetails",
  "startupInfo",
  "product",
  "market",
  "team",
  "traction",
  "funding",
  "verification",
  "preferences",
  "investorInfo",
  "mentorInfo",
  "incubatorInfo",
  "universityInfo",
  "serviceProviderInfo",
  "jobSeekerInfo",
] as const;
export type OnboardingDraftSection = (typeof ONBOARDING_DRAFT_SECTIONS)[number];

/** The most one section's answers may weigh once stored (the longest real section is a few kilobytes). */
export const ONBOARDING_SECTION_MAX_BYTES = 48 * 1024;

export const saveOnboardingDraftInputSchema = z.object({
  section: z.enum(ONBOARDING_DRAFT_SECTIONS),
  step: z.number().int().min(0).max(20),
  data: z
    .record(z.unknown())
    .refine((data) => JSON.stringify(data).length <= ONBOARDING_SECTION_MAX_BYTES, { message: "That's too much to save in one step" }),
});
export type SaveOnboardingDraftInput = z.infer<typeof saveOnboardingDraftInputSchema>;

export const onboardingStateSchema = z.object({
  status: z.nativeEnum(OnboardingStatus),
  step: z.number().int().min(0),
  draft: z.record(z.unknown()).nullable(),
});
export type OnboardingState = z.infer<typeof onboardingStateSchema>;
