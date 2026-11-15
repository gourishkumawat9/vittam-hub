import { z } from "zod";

import { Currency, Industry, RevenueStatus, StartupStage } from "./enums";

const trustBandSchema = z.enum(["STARTING", "BRONZE", "SILVER", "GOLD", "PLATINUM"]);

/**
 * A named, reusable investment thesis — an investor runs several at once
 * (Investor Workspace §6). Each one independently drives a match stream;
 * separate from `Investor.preferred*`, which is the single default thesis
 * plain discovery falls back to.
 */
export const investmentMandateSchema = z.object({
  id: z.string().uuid(),
  investorId: z.string().uuid(),
  name: z.string().min(1).max(120),
  industries: z.array(z.nativeEnum(Industry)),
  stages: z.array(z.nativeEnum(StartupStage)),
  currency: z.nativeEnum(Currency),
  chequeMinAmount: z.number().nonnegative().nullable(),
  chequeMaxAmount: z.number().nonnegative().nullable(),
  geography: z.array(z.string()),
  revenueStatuses: z.array(z.nativeEnum(RevenueStatus)),
  minTrustBand: trustBandSchema.nullable(),
  raisingOnly: z.boolean(),
  requireVerified: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type InvestmentMandate = z.infer<typeof investmentMandateSchema>;

export const createMandateInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  industries: z.array(z.nativeEnum(Industry)).max(60).default([]),
  stages: z.array(z.nativeEnum(StartupStage)).max(20).default([]),
  currency: z.nativeEnum(Currency).default(Currency.INR),
  chequeMinAmount: z.coerce.number().nonnegative().optional(),
  chequeMaxAmount: z.coerce.number().nonnegative().optional(),
  geography: z.array(z.string().max(80)).max(60).default([]),
  revenueStatuses: z.array(z.nativeEnum(RevenueStatus)).max(10).default([]),
  minTrustBand: trustBandSchema.optional(),
  raisingOnly: z.boolean().default(false),
  requireVerified: z.boolean().default(false),
});
export type CreateMandateInput = z.infer<typeof createMandateInputSchema>;

export const updateMandateInputSchema = createMandateInputSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateMandateInput = z.infer<typeof updateMandateInputSchema>;
