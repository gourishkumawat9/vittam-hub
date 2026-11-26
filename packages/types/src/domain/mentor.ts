import { z } from "zod";

import { MeetingMode, MentorFeeType, MentorType, SessionType, StartupStage, VerificationStatus } from "./enums";
import { MENTOR_SESSION_LENGTHS } from "./signup";

export const mentorProfileSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  headline: z.string().max(160).nullable(),
  expertise: z.array(z.string()),
  industries: z.array(z.string()),
  yearsExperience: z.number().int().nonnegative().nullable(),
  availability: z.string().max(200).nullable(),
  sessionTypes: z.array(z.nativeEnum(SessionType)),
  pricingModel: z.string().max(80).nullable(),
  languages: z.array(z.string()),
  pastStartups: z.array(z.string()),
  mentorType: z.nativeEnum(MentorType).nullable(),
  stagesHelped: z.array(z.nativeEnum(StartupStage)),
  meetingMode: z.nativeEnum(MeetingMode).nullable(),
  feeType: z.nativeEnum(MentorFeeType).nullable(),
  sessionFeeAmount: z.number().int().nullable(),
  sessionLengthMinutes: z.number().int().nullable(),
  firstSessionFree: z.boolean(),
  verificationStatus: z.nativeEnum(VerificationStatus),
  isPublic: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type MentorProfileRecord = z.infer<typeof mentorProfileSchema>;

const emptyToNull = (value: unknown) => (value === "" || value === undefined || value === null ? null : value);

/**
 * A mentor's profile. Sign-up asks for what a founder needs to decide whether
 * to request a session: a headline, the kind of mentor you are, what you help
 * with and at which stages, how you meet, your fee, and when you are free. The
 * rest is optional and can be added later. An optional field left empty is
 * stored as empty (null), so clearing one sticks.
 *
 * The fee is structured (free or paid, an amount per session of a set length)
 * so it reads the same on every profile; `pricingModel` is the display text
 * the publisher works out from it (see mentorFeeLabel). No payment is taken
 * through VittamHub yet (CLAUDE.md §5).
 */
export const createMentorInputSchema = z
  .object({
    headline: z.string().min(1, "Add a short headline").max(160),
    expertise: z.array(z.string().max(60)).min(1, "Add at least one area you can help with").max(30),
    industries: z.array(z.string().max(80)).max(40).default([]),
    yearsExperience: z.preprocess(
      (value) => (value === "" || value === undefined || value === null ? null : value),
      z.coerce.number().int().min(0).max(80).nullable(),
    ),
    availability: z.string().min(1, "Say when founders can book you").max(200),
    sessionTypes: z.array(z.nativeEnum(SessionType)).min(1, "Pick at least one kind of session").max(10),
    // Older drafts carried free text here; it is now worked out from the fee fields on publish.
    pricingModel: z.preprocess(emptyToNull, z.string().max(80).nullable()).optional(),
    languages: z.array(z.string().max(40)).max(30).default([]),
    pastStartups: z.array(z.string().max(120)).max(100).default([]),
    mentorType: z.nativeEnum(MentorType, { errorMap: () => ({ message: "Pick the kind of mentor you are" }) }),
    stagesHelped: z.array(z.nativeEnum(StartupStage)).min(1, "Pick at least one stage you help with").max(20),
    meetingMode: z.nativeEnum(MeetingMode, { errorMap: () => ({ message: "Say how you meet founders" }) }),
    feeType: z.nativeEnum(MentorFeeType, { errorMap: () => ({ message: "Say whether your sessions are free or paid" }) }),
    sessionFeeAmount: z.preprocess(emptyToNull, z.coerce.number().int("Whole rupees only").min(1, "Enter your fee").max(500000).nullable()),
    sessionLengthMinutes: z.preprocess(
      emptyToNull,
      z.coerce
        .number()
        .int()
        .refine((minutes) => (MENTOR_SESSION_LENGTHS as readonly number[]).includes(minutes), "Pick a session length")
        .nullable(),
    ),
    firstSessionFree: z.boolean().default(false),
  })
  .superRefine((input, ctx) => {
    if (input.feeType !== MentorFeeType.PAID) return;
    if (input.sessionFeeAmount == null) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sessionFeeAmount"], message: "Enter your fee per session" });
    if (input.sessionLengthMinutes == null) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sessionLengthMinutes"], message: "Pick how long a session is" });
  });
export type CreateMentorInput = z.infer<typeof createMentorInputSchema>;

/** Mentor directory filters — same shape family as investorSearchFiltersSchema. */
export const mentorSearchFiltersSchema = z.object({
  query: z.string().max(200).optional(),
  expertise: z.array(z.string().max(60)).max(50).optional(),
  industries: z.array(z.string().max(80)).max(50).optional(),
  sessionTypes: z.array(z.nativeEnum(SessionType)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type MentorSearchFilters = z.infer<typeof mentorSearchFiltersSchema>;
