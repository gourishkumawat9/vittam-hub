import { z } from "zod";

export const globalSearchFiltersSchema = z.object({
  query: z.string().min(1, "Type something to search").max(200),
});
export type GlobalSearchFilters = z.infer<typeof globalSearchFiltersSchema>;
