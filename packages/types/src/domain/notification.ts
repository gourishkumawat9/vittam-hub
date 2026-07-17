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

export const notificationListFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type NotificationListFilters = z.infer<typeof notificationListFiltersSchema>;
