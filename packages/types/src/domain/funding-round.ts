import { z } from "zod";

import { Currency, FundingInstrument, FundingType } from "./enums";

/**
 * Bundle 12 — each historical funding round as its own row (not overwritten),
 * so total raised and dilution history can be computed. Dates/amounts are
 * founder-declared (V1) until the MCA provider (Phase 2 registry) confirms
 * incorporation-linked filings for real.
 */
export const fundingRoundSchema = z.object({
  id: z.string().uuid(),
  startupId: z.string().uuid(),
  roundType: z.nativeEnum(FundingType),
  instrument: z.nativeEnum(FundingInstrument),
  currency: z.nativeEnum(Currency),
  amount: z.string(), // Decimal serialized as string over the wire
  preMoneyValuation: z.string().nullable(),
  postMoneyValuation: z.string().nullable(),
  leadInvestorName: z.string().nullable(),
  dilutionPercent: z.string().nullable(),
  closedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});
export type FundingRound = z.infer<typeof fundingRoundSchema>;

export const createFundingRoundInputSchema = z.object({
  roundType: z.nativeEnum(FundingType),
  instrument: z.nativeEnum(FundingInstrument),
  currency: z.nativeEnum(Currency).default(Currency.INR),
  amount: z.coerce.number().positive(),
  preMoneyValuation: z.coerce.number().nonnegative().optional(),
  postMoneyValuation: z.coerce.number().nonnegative().optional(),
  leadInvestorName: z.string().max(160).optional(),
  dilutionPercent: z.coerce.number().min(0).max(100).optional(),
  closedAt: z.string().min(1, "Close date is required"),
});
export type CreateFundingRoundInput = z.infer<typeof createFundingRoundInputSchema>;
