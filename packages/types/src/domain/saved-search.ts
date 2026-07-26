import { z } from "zod";

import { startupSearchFiltersSchema } from "./startup";

/**
 * "Seed SaaS India", "Fintech Raising" (Investor Workspace §5) — a saved
 * discovery filter set. `filters` is stored/replayed as the exact same
 * shape StartupsController's search endpoint already accepts (no separate
 * query language), so re-running a saved search is just feeding this JSON
 * back into the existing search.
 */
export const savedSearchSchema = z.object({
  id: z.string().uuid(),
  investorId: z.string().uuid(),
  name: z.string().min(1).max(120),
  filters: startupSearchFiltersSchema,
  notify: z.boolean(),
  lastViewedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type SavedSearch = z.infer<typeof savedSearchSchema>;

export const createSavedSearchInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  filters: startupSearchFiltersSchema.omit({ page: true, pageSize: true }),
  notify: z.boolean().default(false),
});
export type CreateSavedSearchInput = z.infer<typeof createSavedSearchInputSchema>;

export const updateSavedSearchInputSchema = createSavedSearchInputSchema.partial();
export type UpdateSavedSearchInput = z.infer<typeof updateSavedSearchInputSchema>;
