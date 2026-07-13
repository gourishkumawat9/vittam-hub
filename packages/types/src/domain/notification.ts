import { z } from "zod";

import { NotificationType } from "./enums";

export const notificationTypeSchema = z.nativeEnum(NotificationType);

export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string().max(160),
  body: z.string().max(500),
  linkUrl: z.string().url().nullable(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type Notification = z.infer<typeof notificationSchema>;
