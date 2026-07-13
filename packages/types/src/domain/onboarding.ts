import { z } from "zod";

import { OnboardingStatus } from "./enums";

/**
 * Generic autosave payload — one endpoint (`PATCH /v1/onboarding/draft`) for
 * every role. `section` names a key in the role-specific draft shape (e.g.
 * "startupInfo", "product"); `data` is merged into the stored JSON draft
 * rather than replacing it, so saving step 3 never clobbers step 2's answers.
 * See docs/11-onboarding-architecture.md.
 */
export const saveOnboardingDraftInputSchema = z.object({
  section: z.string().min(1),
  step: z.number().int().min(0),
  data: z.record(z.unknown()),
});
export type SaveOnboardingDraftInput = z.infer<typeof saveOnboardingDraftInputSchema>;

export const onboardingStateSchema = z.object({
  status: z.nativeEnum(OnboardingStatus),
  step: z.number().int().min(0),
  draft: z.record(z.unknown()).nullable(),
});
export type OnboardingState = z.infer<typeof onboardingStateSchema>;
