import { z } from "zod";

import { DocumentType } from "./enums";

/** A verification document belongs to the uploading user, not a specific role profile — see schema.prisma's `Document` model comment. */
export const documentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.nativeEnum(DocumentType),
  fileUrl: z.string().url(),
  fileName: z.string(),
  uploadedAt: z.string().datetime(),
  verifiedAt: z.string().datetime().nullable(),
});
export type DocumentRecord = z.infer<typeof documentSchema>;

export const documentUploadInputSchema = z.object({
  type: z.nativeEnum(DocumentType),
  fileUrl: z.string().url(),
  fileName: z.string().min(1).max(200),
});
export type DocumentUploadInput = z.infer<typeof documentUploadInputSchema>;
