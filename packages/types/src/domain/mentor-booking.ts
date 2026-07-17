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
