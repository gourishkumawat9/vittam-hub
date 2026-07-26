import type { InvestorMatchScore, Startup } from "@vittamhub/types";

import { apiRequest } from "../http";

import type { InvestorWithOwner } from "./investors";

export interface AnalyticsBucket {
  label: string;
  count: number;
}

export interface InvestorAnalytics {
  industries: AnalyticsBucket[];
  investmentDistribution: AnalyticsBucket[];
  geography: AnalyticsBucket[];
  stage: AnalyticsBucket[];
  pipeline: AnalyticsBucket[];
  pipelineByIndustry: AnalyticsBucket[];
  meetingConversion: { meetings: number; acceptedConnections: number };
  totalInvestments: number;
  totalPipelineEntries: number;
  connectionsReceived: number;
  averageDealSize: number | null;
  dealsClosed: number;
  pipelineConversion: number | null;
  passReasons: { byReason: AnalyticsBucket[]; byIndustry: AnalyticsBucket[]; averageEvaluationDays: number | null; total: number };
  watchlistConversion: { watchlistSize: number; investedFromWatchlist: number; rate: number | null };
  responseRate: number | null;
  avgResponseTimeHours: number | null;
  portfolioHealth: {
    averageTrustScore: number | null;
    averageGrowthRatePercent: number | null;
    activeInvestments: number;
    exitedInvestments: number;
  };
}

export interface InvestorRecommendations {
  highPotentialStartups: Startup[];
  trendingIndustries: { industry: string; count: number }[];
  emergingMarkets: { location: string; count: number }[];
  fastestGrowingCompanies: Startup[];
  similarToPreviousInvestments: Startup[];
  recentlyVerifiedStartups: Startup[];
  recentlyActiveFounders: Startup[];
}

/** Joins in the matched investor so the founder dashboard never has to do a follow-up fetch per row. */
export interface RecommendedInvestor extends InvestorMatchScore {
  investor: InvestorWithOwner;
}

export interface FounderRecommendations {
  recommendedInvestors: RecommendedInvestor[];
}

export const analyticsApi = {
  get: () => apiRequest<InvestorAnalytics>("/v1/analytics"),
  getRecommendations: () => apiRequest<InvestorRecommendations>("/v1/recommendations"),
  getFounderRecommendations: () => apiRequest<FounderRecommendations>("/v1/recommendations"),
};
