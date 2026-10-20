import { z } from "zod";

import { DiscussionKind, Industry } from "./enums";

/**
 * Domain communities: one Reddit-style space per `Industry`. The community
 * list is the enum itself (no table to seed); this map only adds the copy
 * shown in the UI. URLs use a lowercase, hyphenated slug of the enum value.
 */
export const COMMUNITY_DOMAINS: Record<Industry, { name: string; description: string }> = {
  FINTECH: { name: "Fintech", description: "Payments, lending, wealth, banking infra and RBI compliance." },
  HEALTHTECH: { name: "Healthtech", description: "Digital health, diagnostics, medtech and healthcare delivery." },
  EDTECH: { name: "Edtech", description: "Learning platforms, upskilling, school and higher-ed tools." },
  AGRITECH: { name: "Agritech", description: "Farm inputs, supply chains, FPOs and rural market access." },
  ECOMMERCE: { name: "E-commerce", description: "Marketplaces, quick commerce, logistics and retention." },
  SAAS: { name: "SaaS", description: "B2B software, pricing, GTM and selling globally from India." },
  DEEPTECH: { name: "Deeptech", description: "Hardware, semiconductors, robotics and long R&D cycles." },
  AI_ML: { name: "AI / ML", description: "Building with models, data, evaluation and AI products." },
  LOGISTICS: { name: "Logistics", description: "Freight, last mile, warehousing and supply chain tech." },
  MOBILITY: { name: "Mobility", description: "EVs, ride-hailing, fleets and charging infrastructure." },
  REAL_ESTATE: { name: "Real estate", description: "Property platforms, rentals and real-estate services." },
  MEDIA_ENTERTAINMENT: { name: "Media & entertainment", description: "Content, creators, OTT and audience growth." },
  GAMING: { name: "Gaming", description: "Game studios, esports, monetisation and regulation." },
  CLEANTECH_CLIMATE: { name: "Cleantech & climate", description: "Renewables, carbon, circular economy and climate finance." },
  FOODTECH: { name: "Foodtech", description: "Cloud kitchens, food brands, delivery and FSSAI." },
  RETAIL_D2C: { name: "Retail & D2C", description: "Brands, performance marketing, distribution and unit economics." },
  TRAVEL_HOSPITALITY: { name: "Travel & hospitality", description: "Travel booking, stays, experiences and hospitality tech." },
  HR_TECH: { name: "HR tech", description: "Hiring, payroll, workforce and people operations." },
  LEGAL_TECH: { name: "Legal tech", description: "Contracts, compliance automation and legal services." },
  INSURTECH: { name: "Insurtech", description: "Distribution, claims, underwriting and IRDAI." },
  SPACE_TECH: { name: "Space tech", description: "Launch, satellites, earth observation and IN-SPACe." },
  MANUFACTURING: { name: "Manufacturing", description: "Factories, PLI schemes, supply chains and industry 4.0." },
  CONSTRUCTION_PROPTECH: { name: "Construction & proptech", description: "Construction tech, materials and property operations." },
  SOCIAL_IMPACT: { name: "Social impact", description: "Impact ventures, NGOs, CSR and measuring outcomes." },
  ADTECH: { name: "Adtech & martech", description: "Advertising, attribution and marketing technology." },
  CYBERSECURITY: { name: "Cybersecurity", description: "Security products, compliance and CERT-In requirements." },
  WEB3_BLOCKCHAIN: { name: "Web3 & blockchain", description: "Blockchain products, tokens and the regulatory picture." },
  OTHER: { name: "Open forum", description: "Anything that doesn't fit a domain: fundraising, hiring, ops." },
};

export function industryToCommunitySlug(industry: Industry): string {
  return industry.toLowerCase().replace(/_/g, "-");
}

export function communitySlugToIndustry(slug: string): Industry | undefined {
  const candidate = slug.toUpperCase().replace(/-/g, "_");
  return candidate in Industry ? (candidate as Industry) : undefined;
}

export const DiscussionSort = {
  ACTIVE: "active",
  NEW: "new",
  TOP: "top",
  UNSOLVED: "unsolved",
} as const;
export type DiscussionSort = (typeof DiscussionSort)[keyof typeof DiscussionSort];

export const discussionListFiltersSchema = z.object({
  /** Omit to list across every community; `joined=true` limits it to the caller's communities. */
  industry: z.nativeEnum(Industry).optional(),
  joined: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  sort: z.nativeEnum(DiscussionSort).default("active"),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type DiscussionListFilters = z.infer<typeof discussionListFiltersSchema>;

export const createDiscussionInputSchema = z.object({
  industry: z.nativeEnum(Industry),
  kind: z.nativeEnum(DiscussionKind).default("QUESTION"),
  title: z.string().trim().min(8, "Give it a title of at least 8 characters").max(200),
  body: z.string().trim().min(1, "Add some detail").max(10000),
});
export type CreateDiscussionInput = z.infer<typeof createDiscussionInputSchema>;

export const createDiscussionReplyInputSchema = z.object({
  body: z.string().trim().min(1, "Write a reply").max(5000),
});
export type CreateDiscussionReplyInput = z.infer<typeof createDiscussionReplyInputSchema>;

/** 1 = upvote, -1 = downvote, 0 = clear your vote. */
export const castDiscussionVoteInputSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});
export type CastDiscussionVoteInput = z.infer<typeof castDiscussionVoteInputSchema>;

/** `replyId: null` un-marks the current solution. */
export const markSolutionInputSchema = z.object({
  replyId: z.string().uuid().nullable(),
});
export type MarkSolutionInput = z.infer<typeof markSolutionInputSchema>;
