import type {
  CreateMilestoneInput,
  CreateStartupInput,
  FounderActivityEntry,
  MatchScore,
  PaginatedResult,
  Startup,
  StartupHealth,
  StartupMilestone,
  StartupProfileView,
  StartupSearchFilters,
  TeamMemberCategory,
  TrustScore,
} from "@vittamhub/types";

import { apiRequest } from "../http";

interface StartupTeamMemberSummary {
  id: string;
  category: TeamMemberCategory;
  fullName: string;
  role: string;
  linkedinUrl: string | null;
  photoUrl: string | null;
}

interface StartupProductSummary {
  productName: string | null;
  description: string | null;
  website: string | null;
  demoVideoUrl: string | null;
  pitchVideoUrl: string | null;
  screenshots: string[];
  technologyStack: string[];
}

/** The full public-profile shape — `startupSchema` stays slim for search results; this reflects everything `getBySlug`/`getMine` actually return. */
export interface StartupProfile extends Startup {
  mission: string | null;
  vision: string | null;
  problemStatement: string | null;
  solution: string | null;
  businessModelSummary: string | null;
  headquarters: string | null;
  subIndustry: string | null;
  teamMembers: StartupTeamMemberSummary[];
  product: StartupProductSummary | null;
  milestones: StartupMilestone[];
  trustScore?: TrustScore;
}

/** One Discover Startups card — always carries a Trust Score; `matchScore` is only computed when the caller is an investor. */
export interface StartupSearchResultItem extends Startup {
  headquarters: string | null;
  businessModelSummary: string | null;
  owner: { fullName: string };
  funding: { fundingGoalUsd: number | null } | null;
  traction: { monthlyRevenueUsd: number | null; growthRatePercent: number | null; totalCustomers: number | null } | null;
  trustScore: TrustScore;
  matchScore: MatchScore | null;
}

/** `GET /v1/startups/me/views` joins in the viewing investor's public name/firm. */
export interface StartupProfileViewWithInvestor extends StartupProfileView {
  investor: { fullName: string; avatarUrl: string | null; investorProfile: { firmName: string | null } | null };
}

/** `GET /v1/startups/me/analytics` — every figure is a real aggregate over the caller's own startup. */
export interface FounderAnalytics {
  weeklyProfileViews: { label: string; count: number }[];
  totalInvestorViews: number;
  connectionRequestsReceived: number;
  followerCount: number;
  milestoneCount: number;
  profileCompletionPercent: number;
}

export const startupsApi = {
  search: (filters: StartupSearchFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
      else params.set(key, String(value));
    });
    return apiRequest<PaginatedResult<StartupSearchResultItem>>(`/v1/startups?${params.toString()}`);
  },
  getBySlug: (slug: string) => apiRequest<StartupProfile>(`/v1/startups/${slug}`),
  getMine: () => apiRequest<StartupProfile>("/v1/startups/me"),
  getMyHealth: () => apiRequest<StartupHealth>("/v1/startups/me/health"),
  listMilestones: (slug: string) => apiRequest<StartupMilestone[]>(`/v1/startups/${slug}/milestones`),
  addMilestone: (input: CreateMilestoneInput) =>
    apiRequest<StartupMilestone>("/v1/startups/me/milestones", { method: "POST", body: input }),
  create: (input: CreateStartupInput) => apiRequest<Startup>("/v1/startups", { method: "POST", body: input }),
  getMyActivity: () => apiRequest<FounderActivityEntry[]>("/v1/startups/me/activity"),
  getPublicActivity: (slug: string) => apiRequest<FounderActivityEntry[]>(`/v1/startups/${slug}/activity`),
  getMyProfileViews: () => apiRequest<StartupProfileViewWithInvestor[]>("/v1/startups/me/views"),
  recordView: (slug: string) => apiRequest<StartupProfileView>(`/v1/startups/${slug}/view`, { method: "POST" }),
  getMyAnalytics: () => apiRequest<FounderAnalytics>("/v1/startups/me/analytics"),
};
