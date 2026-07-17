import { z } from "zod";

/** A proposed meeting time on a connection — no calendar sync or video-call provider yet, see CLAUDE.md future-modules. */
export const meetingSchema = z.object({
  id: z.string().uuid(),
  connectionId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  notes: z.string().max(1000).nullable(),
  videoCallUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
});
export type Meeting = z.infer<typeof meetingSchema>;

export const scheduleMeetingInputSchema = z.object({
  scheduledAt: z.string().min(1, "Pick a date and time"),
  notes: z.string().max(1000).optional(),
  videoCallUrl: z.string().url().optional(),
});
export type ScheduleMeetingInput = z.infer<typeof scheduleMeetingInputSchema>;
