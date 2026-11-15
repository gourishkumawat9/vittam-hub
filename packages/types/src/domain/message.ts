import { z } from "zod";

import { httpUrlSchema, optionalHttpUrlSchema } from "./url";

/** Only sendable within a Connection whose status is ACCEPTED — see MessagesService.assertCanMessage. */
export const messageSchema = z.object({
  id: z.string().uuid(),
  connectionId: z.string().uuid(),
  senderId: z.string().uuid(),
  body: z.string().max(4000),
  attachmentUrl: httpUrlSchema.nullable(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type Message = z.infer<typeof messageSchema>;

export const createMessageInputSchema = z.object({
  body: z.string().min(1, "Message can't be empty").max(4000),
  attachmentUrl: optionalHttpUrlSchema,
});
export type CreateMessageInput = z.infer<typeof createMessageInputSchema>;
