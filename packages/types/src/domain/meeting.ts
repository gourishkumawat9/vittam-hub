import { z } from "zod";

import { httpUrlSchema, optionalHttpUrlSchema } from "./url";

/** A proposed meeting time on a connection — no calendar sync or video-call provider yet, see CLAUDE.md future-modules. */
export const meetingSchema = z.object({
  id: z.string().uuid(),
  connectionId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  notes: z.string().max(1000).nullable(),
  videoCallUrl: httpUrlSchema.nullable(),
  createdAt: z.string().datetime(),
});
export type Meeting = z.infer<typeof meetingSchema>;

export const scheduleMeetingInputSchema = z.object({
  // Checked here so a value that isn't a date is a clear 400, not a database error.
  scheduledAt: z
    .string()
    .min(1, "Pick a date and time")
    .refine((value) => !Number.isNaN(Date.parse(value)), { message: "Pick a valid date and time" }),
  notes: z.string().max(1000).optional(),
  videoCallUrl: optionalHttpUrlSchema,
});
export type ScheduleMeetingInput = z.infer<typeof scheduleMeetingInputSchema>;
