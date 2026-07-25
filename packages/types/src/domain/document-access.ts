import { z } from "zod";

/**
 * Bundle 21 — the permissioned data room. Every gated document is shared
 * per-viewer, with an expiry (default 14 days), an optional NDA gate, and a
 * view log the owner can see ("Blume opened your deck twice"). Watermarking
 * is future work — see docs/STATUS.md.
 */
export const createDocumentGrantInputSchema = z.object({
  grantedToId: z.string().uuid(),
  expiresInDays: z.coerce.number().int().min(1).max(365).default(14),
  requireNda: z.boolean().default(false),
});
export type CreateDocumentGrantInput = z.infer<typeof createDocumentGrantInputSchema>;

export const documentGrantSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  grantedToId: z.string().uuid(),
  grantedById: z.string().uuid(),
  expiresAt: z.string().datetime(),
  requireNda: z.boolean(),
  ndaAcceptedAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type DocumentGrant = z.infer<typeof documentGrantSchema>;

export const documentGrantWithViewsSchema = documentGrantSchema.extend({
  grantedTo: z.object({ id: z.string().uuid(), fullName: z.string() }),
  viewCount: z.number().int().nonnegative(),
  lastViewedAt: z.string().datetime().nullable(),
});
export type DocumentGrantWithViews = z.infer<typeof documentGrantWithViewsSchema>;
