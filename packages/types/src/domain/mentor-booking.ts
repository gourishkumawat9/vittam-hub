import { z } from "zod";

import { BookingStatus, SessionType } from "./enums";

/**
 * A founder requesting time with a mentor. Deliberately not a Connection —
 * no monthly quota, repeatable per pair, no messaging/meeting gate — see
 * MentorBookingRequest in schema.prisma for the full rationale.
 */
export const mentorBookingRequestSchema = z.object({
  id: z.string().uuid(),
  founderId: z.string().uuid(),
  mentorId: z.string().uuid(),
  startupId: z.string().uuid().nullable(),
  sessionType: z.nativeEnum(SessionType).nullable(),
  message: z.string().max(2000),
  preferredTimes: z.string().max(500).nullable(),
  status: z.nativeEnum(BookingStatus),
  respondedAt: z.string().datetime().nullable(),
  scheduledAt: z.string().datetime().nullable(),
  durationMinutes: z.number().int().nullable(),
  meetingUrl: z.string().nullable(),
  mentorNote: z.string().nullable(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type MentorBookingRequestRecord = z.infer<typeof mentorBookingRequestSchema>;

export const createMentorBookingInputSchema = z.object({
  sessionType: z.nativeEnum(SessionType).optional(),
  message: z.string().min(1, "Tell the mentor what you'd like to discuss").max(2000),
  preferredTimes: z.string().max(500).optional(),
});
export type CreateMentorBookingInput = z.infer<typeof createMentorBookingInputSchema>;

export const mentorBookingResponseAction = z.enum(["ACCEPT", "DECLINE"]);
export type MentorBookingResponseAction = z.infer<typeof mentorBookingResponseAction>;

export const respondToMentorBookingInputSchema = z.object({
  action: mentorBookingResponseAction,
});
export type RespondToMentorBookingInput = z.infer<typeof respondToMentorBookingInputSchema>;

/** Session lengths a mentor can pick, in minutes. */
export const MENTOR_SESSION_DURATIONS = [30, 45, 60, 90] as const;

const blankToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

/**
 * The mentor sets (or changes) when an accepted session happens. The link is
 * optional, since some sessions are a phone call; when given it must be a
 * plain https link, because it is shown to the founder as "Join call".
 */
export const scheduleMentorSessionInputSchema = z.object({
  scheduledAt: z.string().datetime({ offset: true, message: "Pick a date and time" }),
  durationMinutes: z
    .number()
    .int()
    .refine((value) => (MENTOR_SESSION_DURATIONS as readonly number[]).includes(value), "Pick a session length"),
  meetingUrl: z.preprocess(
    blankToUndefined,
    z
      .string()
      .trim()
      .max(500)
      .url("Paste the full meeting link, starting with https://")
      .refine((value) => value.startsWith("https://"), "Paste the full meeting link, starting with https://")
      .optional(),
  ),
  note: z.preprocess(blankToUndefined, z.string().trim().max(500, "Keep the note under 500 characters").optional()),
});
export type ScheduleMentorSessionInput = z.infer<typeof scheduleMentorSessionInputSchema>;
