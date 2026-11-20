/**
 * Demo data for dashboard preview mode (see ./mode.ts). Nothing here is real:
 * every person and organisation is labelled "Demo" (CLAUDE.md §2), and every
 * number is made up to fill the screens.
 */
import type {
  CoInvestorGraph,
  CommentWithAuthor,
  ConnectionQuota,
  ConnectionWithRelations,
  FounderAnalytics,
  FounderRecommendations,
  GrowthBenchmark,
  IncubatorWithPrograms,
  InvestmentWithStartup,
  InvestorAnalytics,
  InvestorRecommendations,
  InvestorWithMetrics,
  InvestorWithOwner,
  MandateMatch,
  MeetingWithConnection,
  MentorBookingWithRelations,
  MentorWithReputation,
  PipelineEntryWithStartup,
  PortfolioDashboard,
  PostWithRelations,
  SharedDocumentGrant,
  StartupFollowWithStartup,
  StartupProfile,
  StartupProfileViewWithInvestor,
  StartupSearchResultItem,
  UniversityWithOwner,
  WatchlistTriggerWithStartup,
  WorkspaceHome,
} from "@vittamhub/api-client";
import type {
  AdminUserSummary,
  DocumentGrantWithViews,
  DocumentRecord,
  FounderActivityEntry,
  Industry,
  InvestmentMandate,
  Meeting,
  Message,
  Notification,
  PlanLimit,
  SavedSearch,
  Session,
  Startup,
  StartupHealth,
  StartupStage,
  SystemHealth,
  TrustScore,
  TrustV2Preview,
  User,
  UserRole,
  VerificationOverview,
  VerificationProgress,
} from "@vittamhub/types";

import type { PreviewRole } from "./mode";

// ─── Helpers ──────────────────────────────────────────────────────────────

/** A stable UUID-shaped id, so links between screens line up. */
const id = (group: number, n: number) => `00000000-0000-4000-8${String(group).padStart(3, "0")}-${String(n).padStart(12, "0")}`;

const NOW = Date.now();
const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(NOW - n * DAY).toISOString();
const daysAhead = (n: number) => new Date(NOW + n * DAY).toISOString();
const hoursAgo = (n: number) => new Date(NOW - n * 3_600_000).toISOString();

// ─── Users (one per demo role) ────────────────────────────────────────────

const USER_IDS = {
  founder: id(1, 1),
  investor: id(1, 2),
  admin: id(1, 3),
  mentor: id(1, 4),
  incubator: id(1, 5),
  university: id(1, 6),
} as const;

const ROLE_OF: Record<PreviewRole, UserRole> = {
  founder: "FOUNDER",
  investor: "INVESTOR",
  admin: "ADMIN",
  mentor: "MENTOR",
  incubator: "INCUBATOR",
  university: "UNIVERSITY",
};

const NAME_OF: Record<PreviewRole, string> = {
  founder: "Demo Founder",
  investor: "Demo Investor",
  admin: "Demo Admin",
  mentor: "Demo Mentor",
  incubator: "Demo Incubator Team",
  university: "Demo University Cell",
};

export function userFor(role: PreviewRole): User {
  return {
    id: USER_IDS[role],
    email: `${role}@demo.vittamhub.com`,
    fullName: NAME_OF[role],
    avatarUrl: null,
    role: ROLE_OF[role],
    verificationStatus: "VERIFIED",
    emailVerifiedAt: daysAgo(40),
    twoFactorEnabled: false,
    hasPassword: true,
    isDemo: true,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(2),
  };
}

export const userIdFor = (role: PreviewRole) => USER_IDS[role];

// Other demo people who show up on cards.
const PEOPLE = {
  founder2: { id: id(2, 1), fullName: "Demo Founder Two", avatarUrl: null },
  founder3: { id: id(2, 2), fullName: "Demo Founder Three", avatarUrl: null },
  founder4: { id: id(2, 3), fullName: "Demo Founder Four", avatarUrl: null },
  investor2: { id: id(2, 4), fullName: "Demo Investor Two", avatarUrl: null },
  investor3: { id: id(2, 5), fullName: "Demo Investor Three", avatarUrl: null },
  mentor2: { id: id(2, 6), fullName: "Demo Mentor Two", avatarUrl: null },
};

// ─── Startups ─────────────────────────────────────────────────────────────

type StartupSeed = {
  n: number;
  ownerId: string;
  owner: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  industry: Industry;
  stage: StartupStage;
  location: string;
  foundedYear: number;
  teamSize: number;
  isFundraising: boolean;
  fundingRaised: number;
  verified: boolean;
  revenue: number | null;
  growth: number | null;
  customers: number | null;
  goal: number | null;
  trust: number;
  match: number;
};

const SEEDS: StartupSeed[] = [
  {
    n: 1,
    ownerId: USER_IDS.founder,
    owner: "Demo Founder",
    name: "Demo Startup",
    slug: "demo-startup",
    tagline: "AI study planner for college students (demo profile)",
    description:
      "Demo profile for trying VittamHub. Turns a semester syllabus into a daily study plan that adapts when a student falls behind.",
    industry: "EDTECH",
    stage: "MVP",
    location: "Jaipur, India",
    foundedYear: 2026,
    teamSize: 3,
    isFundraising: true,
    fundingRaised: 0,
    verified: true,
    revenue: null,
    growth: 18,
    customers: 240,
    goal: 2_500_000,
    trust: 62,
    match: 86,
  },
  {
    n: 2,
    ownerId: PEOPLE.founder2.id,
    owner: "Demo Founder Two",
    name: "Demo Fintech Startup",
    slug: "demo-fintech-startup",
    tagline: "UPI savings app for first-time earners (demo profile)",
    description: "Demo profile. Rounds up everyday UPI payments into a savings goal.",
    industry: "FINTECH",
    stage: "VALIDATION",
    location: "Bengaluru, India",
    foundedYear: 2026,
    teamSize: 2,
    isFundraising: false,
    fundingRaised: 0,
    verified: true,
    revenue: null,
    growth: null,
    customers: null,
    goal: null,
    trust: 41,
    match: 72,
  },
  {
    n: 3,
    ownerId: PEOPLE.founder3.id,
    owner: "Demo Founder Three",
    name: "KrishiSense (Demo)",
    slug: "krishisense-demo",
    tagline: "Soil sensors and crop advice over WhatsApp (demo profile)",
    description: "Demo profile. Low-cost soil moisture sensors that send farmers irrigation advice in Hindi and Marathi.",
    industry: "AGRITECH",
    stage: "PROTOTYPE",
    location: "Pune, India",
    foundedYear: 2025,
    teamSize: 4,
    isFundraising: true,
    fundingRaised: 500_000,
    verified: false,
    revenue: null,
    growth: null,
    customers: 35,
    goal: 4_000_000,
    trust: 38,
    match: 64,
  },
  {
    n: 4,
    ownerId: PEOPLE.founder4.id,
    owner: "Demo Founder Four",
    name: "MediTrack (Demo)",
    slug: "meditrack-demo",
    tagline: "Medicine reminders and refills for elderly parents (demo profile)",
    description: "Demo profile. A family app that tracks prescriptions and books refills from the nearest pharmacy.",
    industry: "HEALTHTECH",
    stage: "CUSTOMERS",
    location: "Hyderabad, India",
    foundedYear: 2024,
    teamSize: 7,
    isFundraising: true,
    fundingRaised: 2_000_000,
    verified: true,
    revenue: 180_000,
    growth: 24,
    customers: 1_900,
    goal: 15_000_000,
    trust: 74,
    match: 58,
  },
  {
    n: 5,
    ownerId: id(2, 10),
    owner: "Demo Founder Five",
    name: "GreenGrid (Demo)",
    slug: "greengrid-demo",
    tagline: "Rooftop solar monitoring for small factories (demo profile)",
    description: "Demo profile. Monitors rooftop solar output and flags faults before they cost a day of power.",
    industry: "CLEANTECH_CLIMATE",
    stage: "REVENUE",
    location: "New Delhi, India",
    foundedYear: 2023,
    teamSize: 12,
    isFundraising: true,
    fundingRaised: 8_000_000,
    verified: true,
    revenue: 650_000,
    growth: 15,
    customers: 140,
    goal: 30_000_000,
    trust: 81,
    match: 47,
  },
  {
    n: 6,
    ownerId: id(2, 11),
    owner: "Demo Founder Six",
    name: "IdeaBox (Demo)",
    slug: "ideabox-demo",
    tagline: "Not registered yet: a shared notebook for student founders (demo profile)",
    description: "Demo profile of an idea-stage venture with no registered company. Two students validating the idea on campus.",
    industry: "SAAS",
    stage: "IDEA",
    location: "Jaipur, India",
    foundedYear: 2026,
    teamSize: 2,
    isFundraising: false,
    fundingRaised: 0,
    verified: false,
    revenue: null,
    growth: null,
    customers: null,
    goal: null,
    trust: 22,
    match: 69,
  },
  {
    n: 7,
    ownerId: id(2, 12),
    owner: "Demo Founder Seven",
    name: "KiranaOS (Demo)",
    slug: "kiranaos-demo",
    tagline: "Billing and stock app for neighbourhood stores (demo profile)",
    description: "Demo profile. A phone-first billing and inventory app for kirana stores, with UPI reconciliation built in.",
    industry: "RETAIL_D2C",
    stage: "MVP",
    location: "Indore, India",
    foundedYear: 2025,
    teamSize: 5,
    isFundraising: true,
    fundingRaised: 1_000_000,
    verified: true,
    revenue: 40_000,
    growth: 31,
    customers: 320,
    goal: 6_000_000,
    trust: 57,
    match: 77,
  },
  {
    n: 8,
    ownerId: id(2, 13),
    owner: "Demo Founder Eight",
    name: "ShipLite (Demo)",
    slug: "shiplite-demo",
    tagline: "Same-day delivery network for small sellers (demo profile)",
    description: "Demo profile. Pools parcels from small online sellers into shared same-day routes across Mumbai.",
    industry: "LOGISTICS",
    stage: "FUNDED",
    location: "Mumbai, India",
    foundedYear: 2022,
    teamSize: 28,
    isFundraising: false,
    fundingRaised: 45_000_000,
    verified: true,
    revenue: 2_400_000,
    growth: 9,
    customers: 2_600,
    goal: null,
    trust: 88,
    match: 41,
  },
];

const startupId = (n: number) => id(3, n);

function toStartup(s: StartupSeed): Startup {
  return {
    id: startupId(s.n),
    ownerId: s.ownerId,
    name: s.name,
    slug: s.slug,
    tagline: s.tagline,
    description: s.description,
    logoUrl: null,
    website: null,
    industry: s.industry,
    stage: s.stage,
    declaredStage: s.stage,
    productStatus: null,
    revenueStatus: s.revenue ? "RECURRING" : "NONE",
    fundingStatus: s.fundingRaised > 0 ? "ANGEL" : "BOOTSTRAPPED",
    monthsInCurrentStage: 3,
    foundedYear: s.foundedYear,
    teamSize: s.teamSize,
    location: s.location,
    currency: "INR",
    fundingRaisedAmount: s.fundingRaised,
    isFundraising: s.isFundraising,
    verificationStatus: s.verified ? "VERIFIED" : "PENDING",
    isPublic: true,
    visibility: "PUBLIC",
    metricsVisibility: "BAND",
    createdAt: daysAgo(30 + s.n * 9),
    updatedAt: daysAgo(s.n),
  };
}

export const STARTUPS: Startup[] = SEEDS.map(toStartup);
const startupByN = (n: number) => STARTUPS[n - 1]!;

const TRUST_FACTORS = [
  { key: "email", label: "Business email confirmed", weight: 10 },
  { key: "website", label: "Website live", weight: 10 },
  { key: "documents", label: "Registration documents added", weight: 25 },
  { key: "team", label: "Team members listed", weight: 15 },
  { key: "traction", label: "Traction figures added", weight: 20 },
  { key: "milestones", label: "Milestones posted", weight: 20 },
];

function trustScoreOf(score: number): TrustScore {
  let running = 0;
  return {
    score,
    band: score >= 80 ? "EXCELLENT" : score >= 60 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW",
    factors: TRUST_FACTORS.map((f) => {
      running += f.weight;
      return { ...f, earned: running <= score + 5 };
    }),
  };
}

const MATCH_REASONS = (score: number) => [
  { key: "industry", label: "Industry is in your thesis", weight: 30, matched: score > 40 },
  { key: "stage", label: "Stage is one you back", weight: 30, matched: score > 55 },
  { key: "cheque", label: "Raise fits your cheque size", weight: 25, matched: score > 70 },
  { key: "geography", label: "Based in India", weight: 15, matched: true },
];

export const SEARCH_RESULTS: StartupSearchResultItem[] = SEEDS.map((s) => ({
  ...toStartup(s),
  headquarters: s.location,
  businessModelSummary: "Subscription, billed monthly (demo).",
  owner: { fullName: s.owner },
  funding: { fundingGoalAmount: s.goal },
  traction: s.revenue || s.customers ? { monthlyRevenueAmount: s.revenue, growthRatePercent: s.growth, totalCustomers: s.customers } : null,
  trustScore: trustScoreOf(s.trust),
  matchScore: { startupId: startupId(s.n), score: s.match, reasons: MATCH_REASONS(s.match) },
}));

const MILESTONES = [
  {
    id: id(4, 1),
    startupId: startupId(1),
    type: "MVP" as const,
    title: "MVP live for 2 colleges (demo)",
    description: "Beta opened to students at two demo colleges in Jaipur.",
    achievedAt: daysAgo(21),
    evidenceUrls: [],
    createdAt: daysAgo(21),
  },
  {
    id: id(4, 2),
    startupId: startupId(1),
    type: "FIRST_CUSTOMER" as const,
    title: "First 200 student sign-ups (demo)",
    description: null,
    achievedAt: daysAgo(9),
    evidenceUrls: [],
    createdAt: daysAgo(9),
  },
  {
    id: id(4, 3),
    startupId: startupId(1),
    type: "IDEA_CREATED" as const,
    title: "Idea validated with 60 student interviews (demo)",
    description: null,
    achievedAt: daysAgo(80),
    evidenceUrls: [],
    createdAt: daysAgo(80),
  },
];

export const MY_STARTUP: StartupProfile = {
  ...startupByN(1),
  mission: "Help every student finish the semester on track (demo).",
  vision: "A study coach in every student's pocket (demo).",
  problemStatement: "Students plan once at the start of term and fall behind by week four. Nothing re-plans for them.",
  solution: "Upload the syllabus once; the planner rebuilds tomorrow's plan every night from what was actually done.",
  businessModelSummary: "Free for students, paid by colleges per seat (demo).",
  headquarters: "Jaipur, India",
  subIndustry: "Study tools",
  teamMembers: [
    { id: id(5, 1), category: "FOUNDER", fullName: "Demo Founder", role: "CEO", linkedinUrl: null, photoUrl: null },
    { id: id(5, 2), category: "COFOUNDER", fullName: "Demo Co-founder", role: "CTO", linkedinUrl: null, photoUrl: null },
    { id: id(5, 3), category: "ADVISOR", fullName: "Demo Advisor", role: "Education advisor", linkedinUrl: null, photoUrl: null },
  ],
  product: {
    productName: "Demo Planner",
    description: "Web and Android app.",
    website: null,
    demoVideoUrl: null,
    pitchVideoUrl: null,
    screenshots: [],
    technologyStack: ["Next.js", "Python", "PostgreSQL"],
  },
  milestones: MILESTONES,
  trustScore: trustScoreOf(62),
};

export function startupProfileBySlug(slug: string): StartupProfile {
  if (slug === "me" || slug === MY_STARTUP.slug) return MY_STARTUP;
  const found = STARTUPS.find((s) => s.slug === slug) ?? STARTUPS[1]!;
  return {
    ...found,
    mission: null,
    vision: null,
    problemStatement: "Demo problem statement.",
    solution: "Demo solution.",
    businessModelSummary: "Demo business model.",
    headquarters: found.location,
    subIndustry: null,
    teamMembers: [],
    product: null,
    milestones: [],
    trustScore: SEARCH_RESULTS.find((r) => r.id === found.id)?.trustScore,
  };
}

export const STARTUP_HEALTH: StartupHealth = {
  trustScore: trustScoreOf(62),
  profileCompletion: {
    percent: 78,
    missing: [
      { key: "website", label: "Add your website", href: "/onboarding/founder" },
      { key: "pitchDeck", label: "Upload a pitch deck", href: "/founder/documents" },
    ],
  },
  founderReputation: {
    score: 58,
    band: "MEDIUM",
    factors: [
      { key: "linkedin", label: "LinkedIn added", weight: 20, earned: true },
      { key: "experience", label: "Experience listed", weight: 30, earned: true },
      { key: "mentorReviews", label: "Mentor reviews", weight: 50, earned: false },
    ],
  },
};

export const TRUST_PREVIEW: TrustV2Preview = {
  version: "v2",
  stage: "MVP",
  score: 62,
  band: "Silver",
  components: [
    { key: "identity", label: "Identity", max: 20, earned: 16, applicability: 1 },
    { key: "entity", label: "Company details", max: 20, earned: 8, applicability: 1 },
    { key: "traction", label: "Traction", max: 25, earned: 14, applicability: 1 },
    { key: "team", label: "Team", max: 15, earned: 12, applicability: 1 },
    { key: "activity", label: "Activity", max: 20, earned: 12, applicability: 1 },
  ],
  penaltyTotal: 0,
  nextBestActions: [
    { key: "website", label: "Add a website", gap: 6, suggestion: "A live website adds points to Company details." },
    { key: "documents", label: "Add registration documents", gap: 8, suggestion: "Not registered yet? That's fine, add them when you are." },
  ],
  history: [
    { score: 31, band: "Bronze", computedAt: daysAgo(60) },
    { score: 44, band: "Bronze", computedAt: daysAgo(40) },
    { score: 55, band: "Silver", computedAt: daysAgo(20) },
    { score: 62, band: "Silver", computedAt: daysAgo(3) },
  ],
};

export const FOUNDER_ACTIVITY: FounderActivityEntry[] = [
  { id: "a1", type: "MILESTONE", occurredAt: daysAgo(9), title: "First 200 student sign-ups (demo)", description: null },
  { id: "a2", type: "CONNECTION_RECEIVED", occurredAt: daysAgo(6), title: "Connect request accepted by Demo Investor", description: null },
  { id: "a3", type: "DOCUMENT_UPLOADED", occurredAt: daysAgo(12), title: "Pitch deck uploaded", description: null },
  { id: "a4", type: "TRACTION_UPDATED", occurredAt: daysAgo(15), title: "Traction updated", description: "240 users, 18% month-on-month growth" },
  { id: "a5", type: "MILESTONE", occurredAt: daysAgo(21), title: "MVP live for 2 colleges (demo)", description: null },
];

export const PROFILE_VIEWS: StartupProfileViewWithInvestor[] = [
  {
    id: id(6, 1),
    startupId: startupId(1),
    investorId: USER_IDS.investor,
    viewDate: daysAgo(1).slice(0, 10),
    viewCount: 3,
    createdAt: daysAgo(1),
    investor: { fullName: "Demo Investor", avatarUrl: null, investorProfile: { firmName: "Demo Angel Fund" } },
  },
  {
    id: id(6, 2),
    startupId: startupId(1),
    investorId: PEOPLE.investor2.id,
    viewDate: daysAgo(4).slice(0, 10),
    viewCount: 1,
    createdAt: daysAgo(4),
    investor: { fullName: "Demo Investor Two", avatarUrl: null, investorProfile: { firmName: "Demo Seed Partners" } },
  },
];

export const FOUNDER_ANALYTICS: FounderAnalytics = {
  weeklyProfileViews: [
    { label: "W1", count: 2 },
    { label: "W2", count: 4 },
    { label: "W3", count: 3 },
    { label: "W4", count: 7 },
    { label: "W5", count: 6 },
    { label: "W6", count: 11 },
  ],
  totalInvestorViews: 33,
  connectionRequestsReceived: 2,
  followerCount: 14,
  milestoneCount: MILESTONES.length,
  profileCompletionPercent: 78,
};

export const BENCHMARK: GrowthBenchmark = { percentile: 72, sampleSize: 18, industry: "EDTECH", stage: "MVP" };

// ─── Investors ────────────────────────────────────────────────────────────

const investorId = (n: number) => id(7, n);

function investorRecord(
  n: number,
  ownerId: string,
  firmName: string,
  type: InvestorWithOwner["investorType"],
  location: string,
  industries: string[],
  stages: StartupStage[],
  min: number,
  max: number,
): InvestorWithMetrics {
  return {
    id: investorId(n),
    ownerId,
    firmName,
    designation: n === 1 ? "Partner" : "Principal",
    investorType: type,
    bio: `Demo investor profile. ${firmName} backs early Indian startups in ${industries.join(", ").toLowerCase()}.`,
    logoUrl: null,
    website: null,
    currency: "INR",
    checkSizeMinAmount: min,
    checkSizeMaxAmount: max,
    preferredStages: stages,
    preferredIndustries: industries,
    preferredGeography: ["India"],
    portfolioCompanies: ["MediTrack (Demo)", "ShipLite (Demo)"],
    investmentThesis: "Founders who have talked to a hundred users before writing code (demo thesis).",
    openForPitches: true,
    location,
    verificationStatus: "VERIFIED",
    isPublic: true,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(5),
    metrics: { responseRate: 0.82, avgResponseTimeHours: 30, isActive: true },
    trust: { score: 70 - n * 6, band: n === 1 ? "GOLD" : n === 2 ? "SILVER" : "BRONZE" },
  };
}

export const MY_INVESTOR = investorRecord(
  1,
  USER_IDS.investor,
  "Demo Angel Fund",
  "ANGEL",
  "Mumbai, India",
  ["EDTECH", "FINTECH"],
  ["IDEA", "VALIDATION", "PROTOTYPE", "MVP"],
  500_000,
  2_500_000,
);

export const INVESTORS: InvestorWithOwner[] = [
  { ...MY_INVESTOR, owner: { fullName: "Demo Investor", avatarUrl: null } },
  {
    ...investorRecord(2, PEOPLE.investor2.id, "Demo Seed Partners", "VC_FIRM", "Bengaluru, India", ["SAAS", "FINTECH", "AI_ML"], ["MVP", "CUSTOMERS", "REVENUE"], 5_000_000, 25_000_000),
    owner: { fullName: "Demo Investor Two", avatarUrl: null },
  },
  {
    ...investorRecord(3, PEOPLE.investor3.id, "Demo Family Office", "FAMILY_OFFICE", "New Delhi, India", ["CLEANTECH_CLIMATE", "AGRITECH"], ["PROTOTYPE", "MVP", "REVENUE"], 2_000_000, 10_000_000),
    owner: { fullName: "Demo Investor Three", avatarUrl: null },
  },
  {
    ...investorRecord(4, id(2, 20), "Demo Campus Angels", "ANGEL", "Jaipur, India", ["EDTECH", "SAAS"], ["IDEA", "VALIDATION"], 100_000, 1_000_000),
    owner: { fullName: "Demo Investor Four", avatarUrl: null },
  },
];

export const FOUNDER_RECOMMENDATIONS: FounderRecommendations = {
  recommendedInvestors: INVESTORS.map((investor, i) => ({
    investorId: investor.id,
    investor,
    score: [91, 78, 64, 59][i] ?? 50,
    reasons: [
      { key: "industry", label: "Invests in EdTech", weight: 35, matched: i !== 2 },
      { key: "stage", label: "Backs MVP-stage startups", weight: 35, matched: i < 3 },
      { key: "cheque", label: "Cheque size fits your raise", weight: 30, matched: i === 0 || i === 3 },
    ],
  })),
};

// ─── Connections, meetings, messages ──────────────────────────────────────

const connId = (n: number) => id(8, n);
const party = (role: PreviewRole) => ({ id: USER_IDS[role], fullName: NAME_OF[role], avatarUrl: null });
const startupSummary = (n: number) => {
  const s = startupByN(n);
  return { id: s.id, name: s.name, slug: s.slug, logoUrl: null, tagline: s.tagline };
};

export const CONNECTIONS: ConnectionWithRelations[] = [
  {
    id: connId(1),
    requesterId: USER_IDS.founder,
    recipientId: USER_IDS.investor,
    startupId: startupId(1),
    status: "ACCEPTED",
    introduction: "Hi, we're building an adaptive study planner. 240 students in beta, raising ₹25L. Would love your feedback. (demo)",
    currency: "INR",
    fundingRequirementAmount: 2_500_000,
    pitchDeckUrl: "https://example.com/demo-deck.pdf",
    executiveSummaryUrl: null,
    demoLinkUrl: null,
    infoRequestedAt: null,
    createdAt: daysAgo(8),
    respondedAt: daysAgo(6),
    requester: party("founder"),
    recipient: party("investor"),
    startup: startupSummary(1),
  },
  {
    id: connId(2),
    requesterId: PEOPLE.founder3.id,
    recipientId: USER_IDS.investor,
    startupId: startupId(3),
    status: "PENDING",
    introduction: "We make ₹900 soil sensors that talk to farmers on WhatsApp. 35 farms piloting near Pune. (demo)",
    currency: "INR",
    fundingRequirementAmount: 4_000_000,
    pitchDeckUrl: "https://example.com/demo-deck-2.pdf",
    executiveSummaryUrl: null,
    demoLinkUrl: null,
    infoRequestedAt: null,
    createdAt: daysAgo(2),
    respondedAt: null,
    requester: PEOPLE.founder3,
    recipient: party("investor"),
    startup: startupSummary(3),
  },
  {
    id: connId(3),
    requesterId: PEOPLE.founder4.id,
    recipientId: USER_IDS.investor,
    startupId: startupId(4),
    status: "PENDING",
    introduction: "MediTrack helps families manage medicines for elderly parents. 1,900 families, ₹1.8L monthly revenue. (demo)",
    currency: "INR",
    fundingRequirementAmount: 15_000_000,
    pitchDeckUrl: null,
    executiveSummaryUrl: "https://example.com/demo-summary.pdf",
    demoLinkUrl: null,
    infoRequestedAt: null,
    createdAt: hoursAgo(20),
    respondedAt: null,
    requester: PEOPLE.founder4,
    recipient: party("investor"),
    startup: startupSummary(4),
  },
  {
    id: connId(4),
    requesterId: USER_IDS.founder,
    recipientId: PEOPLE.investor2.id,
    startupId: startupId(1),
    status: "PENDING",
    introduction: "Adaptive study planner, 240 students in beta. Raising ₹25L. (demo)",
    currency: "INR",
    fundingRequirementAmount: 2_500_000,
    pitchDeckUrl: null,
    executiveSummaryUrl: null,
    demoLinkUrl: null,
    infoRequestedAt: null,
    createdAt: daysAgo(3),
    respondedAt: null,
    requester: party("founder"),
    recipient: PEOPLE.investor2,
    startup: startupSummary(1),
  },
  {
    id: connId(5),
    requesterId: PEOPLE.founder2.id,
    recipientId: USER_IDS.investor,
    startupId: startupId(2),
    status: "DECLINED",
    introduction: "UPI round-up savings for first jobbers. (demo)",
    currency: "INR",
    fundingRequirementAmount: 1_000_000,
    pitchDeckUrl: null,
    executiveSummaryUrl: null,
    demoLinkUrl: null,
    infoRequestedAt: null,
    createdAt: daysAgo(20),
    respondedAt: daysAgo(17),
    requester: PEOPLE.founder2,
    recipient: party("investor"),
    startup: startupSummary(2),
  },
];

export const MESSAGES: Message[] = [
  {
    id: id(9, 1),
    connectionId: connId(1),
    senderId: USER_IDS.investor,
    body: "Thanks for reaching out. The retention numbers look interesting. Can you share week-4 retention by college? (demo)",
    attachmentUrl: null,
    readAt: daysAgo(5),
    createdAt: daysAgo(6),
  },
  {
    id: id(9, 2),
    connectionId: connId(1),
    senderId: USER_IDS.founder,
    body: "Sure. College A is at 61% and College B at 54%. Happy to walk you through it on a call. (demo)",
    attachmentUrl: null,
    readAt: daysAgo(5),
    createdAt: daysAgo(5),
  },
  {
    id: id(9, 3),
    connectionId: connId(1),
    senderId: USER_IDS.investor,
    body: "Great, I've proposed a time for Thursday. (demo)",
    attachmentUrl: null,
    readAt: null,
    createdAt: daysAgo(4),
  },
];

export const MEETINGS: Meeting[] = [
  {
    id: id(10, 1),
    connectionId: connId(1),
    scheduledAt: daysAhead(2),
    notes: "Walk through retention by college (demo).",
    videoCallUrl: "https://meet.example.com/demo",
    createdAt: daysAgo(4),
  },
];

export const MY_MEETINGS: MeetingWithConnection[] = MEETINGS.map((m) => ({
  ...m,
  connection: {
    id: connId(1),
    requester: { fullName: "Demo Founder" },
    recipient: { fullName: "Demo Investor" },
    startup: { name: "Demo Startup", logoUrl: null },
  },
}));

export function connectionsFor(role: PreviewRole): ConnectionWithRelations[] {
  const me = USER_IDS[role];
  return CONNECTIONS.filter((c) => c.requesterId === me || c.recipientId === me);
}

export const QUOTA: ConnectionQuota = { plan: "FREE", limit: 2, used: 1, remaining: 1 };

// ─── Investor workspace ───────────────────────────────────────────────────

const stub = (n: number) => startupByN(n);

export const MANDATES: InvestmentMandate[] = [
  {
    id: id(11, 1),
    investorId: MY_INVESTOR.id,
    name: "Student and campus startups (demo)",
    industries: ["EDTECH", "SAAS"],
    stages: ["IDEA", "VALIDATION", "MVP"],
    currency: "INR",
    chequeMinAmount: 500_000,
    chequeMaxAmount: 2_500_000,
    geography: ["India"],
    revenueStatuses: [],
    minTrustBand: null,
    raisingOnly: true,
    requireVerified: false,
    isActive: true,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(10),
  },
  {
    id: id(11, 2),
    investorId: MY_INVESTOR.id,
    name: "Fintech for first-time earners (demo)",
    industries: ["FINTECH"],
    stages: ["VALIDATION", "PROTOTYPE", "MVP"],
    currency: "INR",
    chequeMinAmount: 1_000_000,
    chequeMaxAmount: 2_500_000,
    geography: ["India"],
    revenueStatuses: [],
    minTrustBand: "BRONZE",
    raisingOnly: false,
    requireVerified: true,
    isActive: true,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(20),
  },
];

export const MANDATE_MATCHES: MandateMatch[] = [1, 7, 6, 2].map((n) => ({
  startup: stub(n),
  startupId: startupId(n),
  score: SEEDS[n - 1]!.match,
  reasons: MATCH_REASONS(SEEDS[n - 1]!.match),
}));

export const NOTIFICATIONS: Notification[] = [
  {
    id: id(12, 1),
    userId: USER_IDS.investor,
    type: "CONNECTION_REQUEST",
    title: "New connect request from MediTrack (Demo)",
    body: "Demo Founder Four sent you a connect request.",
    linkUrl: "/investor/requests",
    readAt: null,
    createdAt: hoursAgo(20),
  },
  {
    id: id(12, 2),
    userId: USER_IDS.investor,
    type: "WATCHLIST_TRIGGER_FIRED",
    title: "KiranaOS (Demo) posted a milestone",
    body: "A startup on your watchlist posted: 300 stores onboarded (demo).",
    linkUrl: "/investor/watchlist?tab=triggers",
    readAt: null,
    createdAt: daysAgo(1),
  },
  {
    id: id(12, 3),
    userId: USER_IDS.investor,
    type: "MEETING_SCHEDULED",
    title: "Meeting with Demo Startup on Thursday",
    body: "Walk through retention by college (demo).",
    linkUrl: "/investor/meetings",
    readAt: daysAgo(3),
    createdAt: daysAgo(4),
  },
  {
    id: id(12, 4),
    userId: USER_IDS.founder,
    type: "PROFILE_VIEWED",
    title: "Demo Investor viewed your profile",
    body: "An investor from Demo Angel Fund looked at Demo Startup.",
    linkUrl: "/founder/analytics",
    readAt: null,
    createdAt: daysAgo(1),
  },
  {
    id: id(12, 5),
    userId: USER_IDS.founder,
    type: "CONNECTION_ACCEPTED",
    title: "Demo Investor accepted your connect request",
    body: "You can now message each other and schedule a meeting.",
    linkUrl: `/connections/${connId(1)}`,
    readAt: daysAgo(5),
    createdAt: daysAgo(6),
  },
];

export const notificationsFor = (role: PreviewRole) => {
  const mine = NOTIFICATIONS.filter((n) => n.userId === USER_IDS[role]);
  return mine.length
    ? mine
    : [
        {
          id: id(12, 99),
          userId: USER_IDS[role],
          type: "SYSTEM" as const,
          title: "Welcome to the VittamHub preview",
          body: "Everything on this page is demo data.",
          linkUrl: null,
          readAt: null,
          createdAt: hoursAgo(2),
        },
      ];
};

export const WORKSPACE_HOME: WorkspaceHome = {
  header: {
    investorName: "Demo Investor",
    trustScore: 64,
    trustBand: "GOLD",
    responseRate: 0.82,
    avgResponseTimeHours: 30,
    currentlyDeployingCapital: true,
    openMandatesCount: MANDATES.length,
    unreadNotifications: 2,
  },
  pipelineSummary: { total: 6, byStage: { SOURCED: 2, SCREENING: 1, DUE_DILIGENCE: 1, TERM_SHEET: 1, PASSED: 1 } },
  bestMatchesToday: MANDATE_MATCHES.slice(0, 3),
  watchlist: { count: 4, activeTriggers: 3 },
  savedSearchCount: 2,
  activeMandates: MANDATES,
  recentAlerts: NOTIFICATIONS.filter((n) => n.userId === USER_IDS.investor),
};

const pipelineCard = (
  n: number,
  stage: PipelineEntryWithStartup["stage"],
  notes: string | null,
  extra: Partial<PipelineEntryWithStartup> = {},
): PipelineEntryWithStartup => {
  const seed = SEEDS[n - 1]!;
  return {
    id: id(13, n),
    investorId: MY_INVESTOR.id,
    startupId: startupId(n),
    mandateId: null,
    stage,
    notes,
    passReason: null,
    passNote: null,
    passedAt: null,
    createdAt: daysAgo(20 - n),
    updatedAt: daysAgo(n),
    startup: {
      ...stub(n),
      traction: { monthlyRevenueAmount: seed.revenue, arrAmount: seed.revenue ? seed.revenue * 12 : null, mrrAmount: seed.revenue, totalUsers: seed.customers, growthRatePercent: seed.growth },
      funding: { currentRaiseAmount: seed.goal, fundingGoalAmount: seed.goal, valuationAmount: seed.goal ? seed.goal * 8 : null },
    },
    trustScore: { score: seed.trust, band: seed.trust >= 80 ? "PLATINUM" : seed.trust >= 60 ? "GOLD" : seed.trust >= 40 ? "SILVER" : "BRONZE" },
    matchScore: { startupId: startupId(n), score: seed.match, reasons: MATCH_REASONS(seed.match) },
    ...extra,
  };
};

export const PIPELINE: PipelineEntryWithStartup[] = [
  pipelineCard(1, "DUE_DILIGENCE", "Strong retention. Check college contracts. (demo)"),
  pipelineCard(7, "SCREENING", null),
  pipelineCard(3, "SOURCED", "Met at a demo agri event."),
  pipelineCard(6, "SOURCED", null),
  pipelineCard(4, "TERM_SHEET", "Lead is Demo Seed Partners. (demo)"),
  pipelineCard(2, "PASSED", null, { passReason: "TOO_EARLY", passNote: "Revisit after 6 months of savings data. (demo)", passedAt: daysAgo(17) }),
];

export const PORTFOLIO: InvestmentWithStartup[] = [5, 8].map((n, i) => {
  const seed = SEEDS[n - 1]!;
  return {
    id: id(14, n),
    investorId: MY_INVESTOR.id,
    startupId: startupId(n),
    investedAt: daysAgo(300 + i * 200),
    currency: "INR",
    amount: i === 0 ? 1_500_000 : 2_500_000,
    notes: "Demo investment.",
    exitedAt: null,
    exitValueAmount: null,
    nextFollowUpAt: daysAhead(10 + i * 14),
    createdAt: daysAgo(300 + i * 200),
    startup: {
      ...stub(n),
      traction: { monthlyRevenueAmount: seed.revenue, arrAmount: seed.revenue ? seed.revenue * 12 : null, growthRatePercent: seed.growth },
    },
  };
});

export const PORTFOLIO_DASHBOARD: PortfolioDashboard = {
  totalInvestments: 2,
  activeInvestments: 2,
  exitedInvestments: 0,
  unrealisedAmount: 4_000_000,
  realisedAmount: 0,
  averageTrustScore: 84,
  averageGrowthRatePercent: 12,
  latestMilestones: [
    { id: id(4, 20), title: "Crossed 140 factory customers (demo)", type: "REVENUE", achievedAt: daysAgo(6), startup: { name: "GreenGrid (Demo)", logoUrl: null } },
    { id: id(4, 21), title: "Launched in Pune (demo)", type: "PRODUCT_LAUNCH", achievedAt: daysAgo(15), startup: { name: "ShipLite (Demo)", logoUrl: null } },
  ],
  recentRevenueImprovements: [{ startupId: startupId(5), from: "₹1L–₹5L", to: "₹5L–₹10L" }],
  recentTrustImprovements: [{ startupId: startupId(8), from: 82, to: 88 }],
  recentVerificationChanges: [],
  upcomingFollowUps: PORTFOLIO.map(({ startup, ...investment }) => ({ ...investment, startup: { name: startup.name, logoUrl: null } })),
};

export const WATCHLIST: StartupFollowWithStartup[] = [7, 3, 6, 4].map((n, i) => ({
  id: id(15, n),
  investorId: MY_INVESTOR.id,
  startupId: startupId(n),
  notifyOnUpdate: i < 2,
  notes: i === 0 ? "Growing fast in Indore. (demo)" : null,
  listName: i < 2 ? "Watchlist" : "Saved",
  createdAt: daysAgo(10 + i),
  startup: stub(n),
}));

export const WATCHLIST_TRIGGERS: WatchlistTriggerWithStartup[] = [
  {
    id: id(16, 1),
    investorId: MY_INVESTOR.id,
    startupId: startupId(7),
    type: "MILESTONE_POSTED",
    thresholdAmount: null,
    thresholdBand: null,
    baselineValue: null,
    isActive: true,
    firedAt: daysAgo(1),
    createdAt: daysAgo(10),
    startup: { id: startupId(7), name: "KiranaOS (Demo)", logoUrl: null, slug: "kiranaos-demo" },
  },
  {
    id: id(16, 2),
    investorId: MY_INVESTOR.id,
    startupId: startupId(3),
    type: "FUNDING_ROUND_OPENED",
    thresholdAmount: null,
    thresholdBand: null,
    baselineValue: null,
    isActive: true,
    firedAt: null,
    createdAt: daysAgo(8),
    startup: { id: startupId(3), name: "KrishiSense (Demo)", logoUrl: null, slug: "krishisense-demo" },
  },
  {
    id: id(16, 3),
    investorId: MY_INVESTOR.id,
    startupId: startupId(4),
    type: "REVENUE_ABOVE",
    thresholdAmount: 500_000,
    thresholdBand: null,
    baselineValue: null,
    isActive: true,
    firedAt: null,
    createdAt: daysAgo(5),
    startup: { id: startupId(4), name: "MediTrack (Demo)", logoUrl: null, slug: "meditrack-demo" },
  },
];

export const SAVED_SEARCHES: SavedSearch[] = [
  { id: id(17, 1), investorId: MY_INVESTOR.id, name: "EdTech, MVP, raising (demo)", filters: { page: 1, pageSize: 20, industry: ["EDTECH"], stage: ["MVP"], isFundraising: true }, notify: true, lastViewedAt: daysAgo(3), createdAt: daysAgo(25), updatedAt: daysAgo(3) },
  { id: id(17, 2), investorId: MY_INVESTOR.id, name: "Unregistered idea-stage ventures (demo)", filters: { page: 1, pageSize: 20, stage: ["IDEA", "VALIDATION"] }, notify: false, lastViewedAt: daysAgo(9), createdAt: daysAgo(18), updatedAt: daysAgo(9) },
];

export const CO_INVESTORS: CoInvestorGraph = {
  coInvestors: [
    {
      investorId: investorId(2),
      fullName: "Demo Investor Two",
      avatarUrl: null,
      sharedStartups: [{ id: startupId(5), name: "GreenGrid (Demo)", logoUrl: null }],
    },
    {
      investorId: investorId(3),
      fullName: "Demo Investor Three",
      avatarUrl: null,
      sharedStartups: [
        { id: startupId(5), name: "GreenGrid (Demo)", logoUrl: null },
        { id: startupId(8), name: "ShipLite (Demo)", logoUrl: null },
      ],
    },
  ],
  mutualConfirmations: 1,
  syndicatePartners: INVESTORS.slice(1).map((inv) => ({
    ownerId: inv.ownerId,
    firmName: inv.firmName,
    investorType: inv.investorType,
    preferredIndustries: inv.preferredIndustries,
    preferredStages: inv.preferredStages,
    owner: { fullName: inv.owner.fullName },
  })),
};

export const INVESTOR_ANALYTICS: InvestorAnalytics = {
  industries: [
    { label: "EDTECH", count: 4 },
    { label: "FINTECH", count: 3 },
    { label: "AGRITECH", count: 2 },
    { label: "HEALTHTECH", count: 1 },
  ],
  investmentDistribution: [
    { label: "CLEANTECH_CLIMATE", count: 1 },
    { label: "LOGISTICS", count: 1 },
  ],
  geography: [
    { label: "Jaipur", count: 3 },
    { label: "Bengaluru", count: 2 },
    { label: "Pune", count: 2 },
    { label: "Mumbai", count: 1 },
  ],
  stage: [
    { label: "IDEA", count: 1 },
    { label: "VALIDATION", count: 2 },
    { label: "MVP", count: 3 },
    { label: "CUSTOMERS", count: 1 },
  ],
  pipeline: [
    { label: "SOURCED", count: 2 },
    { label: "SCREENING", count: 1 },
    { label: "DUE_DILIGENCE", count: 1 },
    { label: "TERM_SHEET", count: 1 },
    { label: "PASSED", count: 1 },
  ],
  pipelineByIndustry: [
    { label: "EDTECH", count: 1 },
    { label: "RETAIL_D2C", count: 1 },
    { label: "AGRITECH", count: 1 },
    { label: "SAAS", count: 1 },
    { label: "HEALTHTECH", count: 1 },
  ],
  meetingConversion: { meetings: 1, acceptedConnections: 1 },
  totalInvestments: 2,
  totalPipelineEntries: 6,
  connectionsReceived: 4,
  averageDealSize: 2_000_000,
  dealsClosed: 2,
  pipelineConversion: 0.33,
  passReasons: { byReason: [{ label: "TOO_EARLY", count: 1 }], byIndustry: [{ label: "FINTECH", count: 1 }], averageEvaluationDays: 3, total: 1 },
  watchlistConversion: { watchlistSize: 4, investedFromWatchlist: 0, rate: 0 },
  responseRate: 0.82,
  avgResponseTimeHours: 30,
  portfolioHealth: { averageTrustScore: 84, averageGrowthRatePercent: 12, activeInvestments: 2, exitedInvestments: 0 },
};

export const INVESTOR_RECOMMENDATIONS: InvestorRecommendations = {
  highPotentialStartups: [stub(1), stub(7), stub(4)],
  trendingIndustries: [
    { industry: "EDTECH", count: 6 },
    { industry: "FINTECH", count: 5 },
    { industry: "AGRITECH", count: 3 },
  ],
  emergingMarkets: [
    { location: "Jaipur", count: 4 },
    { location: "Indore", count: 2 },
    { location: "Pune", count: 2 },
  ],
  fastestGrowingCompanies: [stub(7), stub(4), stub(1)],
  similarToPreviousInvestments: [stub(5), stub(3)],
  recentlyVerifiedStartups: [stub(1), stub(2)],
  recentlyActiveFounders: [stub(6), stub(1), stub(3)],
};

// ─── Documents ────────────────────────────────────────────────────────────

export function documentsFor(role: PreviewRole): DocumentRecord[] {
  const userId = USER_IDS[role];
  if (role === "founder") {
    return [
      { id: id(18, 1), userId, type: "PITCH_DECK", fileName: "Demo Startup pitch deck.pdf", uploadedAt: daysAgo(12), verifiedAt: null },
      { id: id(18, 2), userId, type: "FINANCIAL_STATEMENT", fileName: "Demo monthly numbers.xlsx", uploadedAt: daysAgo(15), verifiedAt: null },
      { id: id(18, 3), userId, type: "OTHER", fileName: "Demo college pilot letter.pdf", uploadedAt: daysAgo(20), verifiedAt: null },
    ];
  }
  if (role === "investor") {
    return [{ id: id(18, 10), userId, type: "MEETING_NOTES", fileName: "Demo meeting notes.pdf", uploadedAt: daysAgo(4), verifiedAt: null }];
  }
  return [];
}

export const DOCUMENT_GRANTS: DocumentGrantWithViews[] = [
  {
    id: id(19, 1),
    documentId: id(18, 1),
    grantedToId: USER_IDS.investor,
    grantedById: USER_IDS.founder,
    expiresAt: daysAhead(9),
    requireNda: false,
    ndaAcceptedAt: null,
    revokedAt: null,
    createdAt: daysAgo(5),
    grantedTo: { id: USER_IDS.investor, fullName: "Demo Investor" },
    viewCount: 4,
    lastViewedAt: daysAgo(1),
  },
];

export const SHARED_WITH_ME: SharedDocumentGrant[] = [
  {
    id: id(19, 1),
    documentId: id(18, 1),
    grantedToId: USER_IDS.investor,
    grantedById: USER_IDS.founder,
    expiresAt: daysAhead(9),
    requireNda: false,
    ndaAcceptedAt: null,
    revokedAt: null,
    createdAt: daysAgo(5),
    document: { id: id(18, 1), type: "PITCH_DECK", fileName: "Demo Startup pitch deck.pdf", userId: USER_IDS.founder },
  },
  {
    id: id(19, 2),
    documentId: id(18, 20),
    grantedToId: USER_IDS.investor,
    grantedById: PEOPLE.founder4.id,
    expiresAt: daysAhead(3),
    requireNda: true,
    ndaAcceptedAt: null,
    revokedAt: null,
    createdAt: daysAgo(1),
    document: { id: id(18, 20), type: "CAP_TABLE", fileName: "MediTrack (Demo) cap table.xlsx", userId: PEOPLE.founder4.id },
  },
];

// ─── Mentors, incubators, universities ────────────────────────────────────

const mentorRecord = (
  n: number,
  ownerId: string,
  fullName: string,
  headline: string,
  expertise: string[],
  years: number,
  rating: number | null,
  sessions: number,
): MentorWithReputation => ({
  id: id(20, n),
  ownerId,
  headline,
  expertise,
  industries: ["EDTECH", "FINTECH", "SAAS"].slice(0, 1 + (n % 3)),
  yearsExperience: years,
  availability: "Weekday evenings (demo)",
  sessionTypes: n % 2 ? ["ONE_ON_ONE", "ADVISORY"] : ["ONE_ON_ONE", "GROUP"],
  pricingModel: n === 3 ? "₹1,500 per session (demo)" : "Free",
  languages: ["English", "Hindi"],
  pastStartups: [],
  verificationStatus: "VERIFIED",
  isPublic: true,
  createdAt: daysAgo(70),
  updatedAt: daysAgo(7),
  owner: { fullName, avatarUrl: null },
  reputation: { averageRating: rating, reviewCount: rating ? sessions - 1 : 0, sessionsCompleted: sessions },
});

export const MENTORS: MentorWithReputation[] = [
  mentorRecord(1, USER_IDS.mentor, "Demo Mentor", "Demo mentor · Product and pricing", ["Product", "Pricing", "Go-to-market"], 8, 4.7, 12),
  mentorRecord(2, PEOPLE.mentor2.id, "Demo Mentor Two", "Demo mentor · Fundraising for first-time founders", ["Fundraising", "Pitch decks"], 12, 4.9, 21),
  mentorRecord(3, id(2, 30), "Demo Mentor Three", "Demo mentor · Company registration and compliance", ["Legal", "Compliance"], 15, 4.5, 6),
  mentorRecord(4, id(2, 31), "Demo Mentor Four", "Demo mentor · Validating an idea before you build", ["Customer discovery", "Validation"], 5, null, 0),
];

export const BOOKINGS: MentorBookingWithRelations[] = [
  {
    id: id(21, 1),
    founderId: USER_IDS.founder,
    mentorId: USER_IDS.mentor,
    startupId: startupId(1),
    sessionType: "ONE_ON_ONE",
    message: "We're unsure how to price for colleges. Could we go through three pricing options? (demo)",
    preferredTimes: "Any weekday after 6 pm",
    status: "PENDING",
    respondedAt: null,
    createdAt: daysAgo(1),
    founder: party("founder"),
    mentor: party("mentor"),
    startup: { id: startupId(1), name: "Demo Startup", slug: "demo-startup", logoUrl: null },
  },
  {
    id: id(21, 2),
    founderId: PEOPLE.founder3.id,
    mentorId: USER_IDS.mentor,
    startupId: startupId(3),
    sessionType: "ADVISORY",
    message: "Need help planning our go-to-market in Maharashtra. (demo)",
    preferredTimes: null,
    status: "ACCEPTED",
    respondedAt: daysAgo(4),
    createdAt: daysAgo(6),
    founder: PEOPLE.founder3,
    mentor: party("mentor"),
    startup: { id: startupId(3), name: "KrishiSense (Demo)", slug: "krishisense-demo", logoUrl: null },
  },
  {
    id: id(21, 3),
    founderId: USER_IDS.founder,
    mentorId: PEOPLE.mentor2.id,
    startupId: startupId(1),
    sessionType: "ONE_ON_ONE",
    message: "Review of our seed pitch deck before investor meetings. (demo)",
    preferredTimes: "Saturday morning",
    status: "ACCEPTED",
    respondedAt: daysAgo(9),
    createdAt: daysAgo(11),
    founder: party("founder"),
    mentor: PEOPLE.mentor2,
    startup: { id: startupId(1), name: "Demo Startup", slug: "demo-startup", logoUrl: null },
  },
];

export function bookingsFor(role: PreviewRole): MentorBookingWithRelations[] {
  const me = USER_IDS[role];
  return BOOKINGS.filter((b) => b.founderId === me || b.mentorId === me);
}

const incubatorRecord = (n: number, name: string, kind: "INCUBATOR" | "ACCELERATOR", description: string): IncubatorWithPrograms => ({
  id: id(22, n),
  ownerId: n === 1 ? USER_IDS.incubator : id(2, 40 + n),
  organizationName: name,
  description,
  website: null,
  logoUrl: null,
  industries: ["EDTECH", "FINTECH", "AGRITECH"].slice(0, n + 1),
  portfolioCompanies: ["KiranaOS (Demo)"],
  affiliatedMentorCount: 6 + n * 3,
  kind,
  verificationStatus: "VERIFIED",
  isPublic: true,
  createdAt: daysAgo(100),
  updatedAt: daysAgo(12),
  programs: [
    {
      id: id(23, n),
      name: n === 1 ? "Demo pre-incubation programme" : `${name} cohort ${n}`,
      description: "12-week demo programme. Idea to MVP stage, unregistered startups welcome.",
      durationWeeks: 12,
      applicationCycleStart: daysAgo(5),
      applicationCycleEnd: daysAhead(25),
      applicationUrl: null,
      eligibilityCriteria: "Idea to MVP stage. Company registration not required.",
    },
  ],
});

export const INCUBATORS: IncubatorWithPrograms[] = [
  incubatorRecord(1, "Demo Incubator", "INCUBATOR", "Demo incubator profile for trying VittamHub."),
  incubatorRecord(2, "Demo Accelerator", "ACCELERATOR", "Demo accelerator for MVP-stage startups."),
  incubatorRecord(3, "Demo Rural Innovation Hub", "INCUBATOR", "Demo incubator focused on agriculture and rural startups."),
];

const universityRecord = (n: number, name: string, cell: string): UniversityWithOwner => ({
  id: id(24, n),
  ownerId: n === 1 ? USER_IDS.university : id(2, 50 + n),
  institutionName: name,
  affiliationType: n === 2 ? "Government" : "Private",
  website: null,
  logoUrl: null,
  incubationCellName: cell,
  departments: ["Management", "Engineering"],
  programsOffered: ["Student startup programme"],
  verificationStatus: "VERIFIED",
  isPublic: true,
  createdAt: daysAgo(110),
  updatedAt: daysAgo(15),
  owner: { fullName: `${name} team`, avatarUrl: null },
});

export const UNIVERSITIES: UniversityWithOwner[] = [
  universityRecord(1, "Demo University", "Demo University Startup Cell"),
  universityRecord(2, "Demo Institute of Technology", "Demo E-Cell"),
  universityRecord(3, "Demo School of Management", "Demo Entrepreneurship Centre"),
];

// ─── Community ────────────────────────────────────────────────────────────

const personRef = (role: PreviewRole) => ({ id: USER_IDS[role], fullName: NAME_OF[role], avatarUrl: null });

export const POSTS: PostWithRelations[] = [
  {
    id: id(25, 1),
    authorId: USER_IDS.founder,
    startupId: startupId(1),
    type: "STARTUP_UPDATE",
    body: "We crossed 200 student sign-ups across two colleges this month. Week-4 retention is 58%. Next: a pilot with a third college. (demo post)",
    mediaUrls: [],
    eventStartsAt: null,
    eventLocation: null,
    eventUrl: null,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    author: personRef("founder"),
    startup: { id: startupId(1), name: "Demo Startup", slug: "demo-startup", logoUrl: null },
    pollOptions: [],
    isBookmarked: false,
    isLiked: true,
    isAttending: false,
    _count: { comments: 2, likes: 9, rsvps: 0 },
  },
  {
    id: id(25, 2),
    authorId: USER_IDS.incubator,
    startupId: null,
    type: "EVENT",
    body: "Demo pre-incubation programme: open office hours for idea-stage founders. Company registration not needed. (demo event)",
    mediaUrls: [],
    eventStartsAt: daysAhead(6),
    eventLocation: "Jaipur and online",
    eventUrl: null,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    author: personRef("incubator"),
    startup: null,
    pollOptions: [],
    isBookmarked: true,
    isLiked: false,
    isAttending: false,
    _count: { comments: 1, likes: 14, rsvps: 11 },
  },
  {
    id: id(25, 3),
    authorId: USER_IDS.mentor,
    startupId: null,
    type: "POLL",
    body: "Founders: what's the hardest part of your first 90 days? (demo poll)",
    mediaUrls: [],
    eventStartsAt: null,
    eventLocation: null,
    eventUrl: null,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    author: personRef("mentor"),
    startup: null,
    pollOptions: [
      { id: id(26, 1), postId: id(25, 3), label: "Finding first users", order: 0, voteCount: 12, votedByMe: false },
      { id: id(26, 2), postId: id(25, 3), label: "Finding a co-founder", order: 1, voteCount: 7, votedByMe: false },
      { id: id(26, 3), postId: id(25, 3), label: "Knowing what to build", order: 2, voteCount: 9, votedByMe: false },
    ],
    isBookmarked: false,
    isLiked: false,
    isAttending: false,
    _count: { comments: 0, likes: 5, rsvps: 0 },
  },
  {
    id: id(25, 4),
    authorId: PEOPLE.founder2.id,
    startupId: startupId(2),
    type: "FOUNDER_POST",
    body: "Not registered yet and still validating. We interviewed 40 first-time earners this week: most save in cash, not apps. Changing our onboarding. (demo post)",
    mediaUrls: [],
    eventStartsAt: null,
    eventLocation: null,
    eventUrl: null,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
    author: PEOPLE.founder2,
    startup: { id: startupId(2), name: "Demo Fintech Startup", slug: "demo-fintech-startup", logoUrl: null },
    pollOptions: [],
    isBookmarked: false,
    isLiked: false,
    isAttending: false,
    _count: { comments: 3, likes: 6, rsvps: 0 },
  },
  {
    id: id(25, 5),
    authorId: USER_IDS.university,
    startupId: null,
    type: "ANNOUNCEMENT",
    body: "Demo University Startup Cell is accepting student ventures for next semester's cohort. (demo announcement)",
    mediaUrls: [],
    eventStartsAt: null,
    eventLocation: null,
    eventUrl: null,
    createdAt: daysAgo(6),
    updatedAt: daysAgo(6),
    author: personRef("university"),
    startup: null,
    pollOptions: [],
    isBookmarked: false,
    isLiked: false,
    isAttending: false,
    _count: { comments: 0, likes: 4, rsvps: 0 },
  },
];

export function commentsFor(postId: string): CommentWithAuthor[] {
  return [
    { id: id(27, 1), postId, authorId: USER_IDS.mentor, body: "Great progress. What's driving the retention? (demo comment)", createdAt: hoursAgo(10), author: personRef("mentor") },
    { id: id(27, 2), postId, authorId: USER_IDS.investor, body: "Would love to see the cohort chart. (demo comment)", createdAt: hoursAgo(6), author: personRef("investor") },
  ];
}

// ─── Settings, verification, admin ────────────────────────────────────────

export const SESSIONS: Session[] = [
  { id: id(28, 1), deviceLabel: "Chrome on macOS", ipAddress: "203.0.113.10", lastUsedAt: hoursAgo(0), createdAt: daysAgo(2), isCurrent: true },
  { id: id(28, 2), deviceLabel: "VittamHub on Android", ipAddress: "203.0.113.24", lastUsedAt: daysAgo(3), createdAt: daysAgo(20), isCurrent: false },
];

export function verificationFor(role: PreviewRole): VerificationProgress | null {
  if (role === "admin") return null;
  const entityType = ({
    founder: "Startup",
    investor: "Investor",
    mentor: "MentorProfile",
    incubator: "IncubatorProfile",
    university: "UniversityProfile",
  } as const)[role];
  return {
    entityType,
    status: "VERIFIED",
    requirements: [
      { key: "email", label: "Email address confirmed", met: true },
      { key: "profile", label: "Profile details complete", met: true },
      { key: "website", label: "Website or LinkedIn added", met: role !== "founder" },
    ],
  };
}

export const SYSTEM_HEALTH: SystemHealth = {
  checkedAt: new Date(NOW).toISOString(),
  overall: "DEGRADED",
  blockingCount: 0,
  dependencies: [
    { name: "Database", state: "OPERATIONAL", detail: "Demo: answering normally.", userFacingImpact: false },
    { name: "Redis", state: "OPERATIONAL", detail: "Demo: answering normally.", userFacingImpact: false },
    { name: "Email", state: "OPERATIONAL", detail: "Demo: sending.", userFacingImpact: false },
    { name: "File storage", state: "NOT_CONFIGURED", detail: "Demo: uploads switched off.", userFacingImpact: true },
    { name: "CAPTCHA", state: "NOT_CONFIGURED", detail: "Demo: not set up.", userFacingImpact: false },
  ],
};

export const VERIFICATION_OVERVIEW: VerificationOverview = {
  counts: {
    startup: [
      { status: "VERIFIED", count: 6 },
      { status: "PENDING", count: 2 },
      { status: "UNVERIFIED", count: 3 },
    ],
    investor: [
      { status: "VERIFIED", count: 4 },
      { status: "PENDING", count: 1 },
    ],
    mentorProfile: [{ status: "VERIFIED", count: 4 }],
    incubatorProfile: [{ status: "VERIFIED", count: 3 }],
  },
  pending: {
    startup: [
      { id: startupId(3), name: "KrishiSense (Demo)", createdAt: daysAgo(57) },
      { id: startupId(6), name: "IdeaBox (Demo)", createdAt: daysAgo(84) },
    ],
    investor: [{ id: investorId(5), firmName: "Demo Pending Angels", createdAt: daysAgo(3) }],
    mentorProfile: [],
    incubatorProfile: [],
  },
};

export const ADMIN_USERS: AdminUserSummary[] = (
  [
    ["founder", "FOUNDER"],
    ["investor", "INVESTOR"],
    ["mentor", "MENTOR"],
    ["incubator", "INCUBATOR"],
    ["university", "UNIVERSITY"],
    ["admin", "ADMIN"],
  ] as const
).map(([role, roleEnum], i) => ({
  id: USER_IDS[role],
  email: `${role}@demo.vittamhub.com`,
  fullName: NAME_OF[role],
  role: roleEnum,
  verificationStatus: i < 5 ? "VERIFIED" : "UNVERIFIED",
  createdAt: daysAgo(60 - i * 5),
}));

export const PLAN_LIMITS: PlanLimit[] = [
  { plan: "FREE", monthlyConnectRequestLimit: 2, updatedAt: daysAgo(15) },
  { plan: "FOUNDER_PRO", monthlyConnectRequestLimit: 25, updatedAt: daysAgo(15) },
  { plan: "INVESTOR_PRO", monthlyConnectRequestLimit: null, updatedAt: daysAgo(15) },
  { plan: "ENTERPRISE", monthlyConnectRequestLimit: null, updatedAt: null },
];

// ─── Profile wizard ("Edit profile") ──────────────────────────────────────

const PERSONAL_DETAILS = (role: PreviewRole) => ({
  fullName: NAME_OF[role],
  mobileNumber: "0000000000",
  dateOfBirth: "1995-01-01",
  gender: "PREFER_NOT_TO_SAY",
  nationality: "Indian",
  city: "Jaipur",
  state: "Rajasthan",
  country: "India",
  bio: "Demo account for trying VittamHub.",
  linkedinUrl: "https://www.linkedin.com/in/demo",
  yearsOfExperience: 4,
});

/**
 * What the wizard holds when a live profile is reopened for editing: the
 * same shape the API builds in onboarding/profile-draft.ts, so the wizard
 * opens filled in rather than empty.
 */
export function onboardingDraftFor(role: PreviewRole): Record<string, unknown> {
  const personalDetails = PERSONAL_DETAILS(role);
  switch (role) {
    case "founder":
      return {
        personalDetails,
        startupInfo: {
          name: MY_STARTUP.name,
          tagline: MY_STARTUP.tagline,
          description: MY_STARTUP.description,
          stage: "MVP",
          productStatus: "BETA",
          revenueStatus: "NONE",
          fundingStatus: "BOOTSTRAPPED",
          industry: "EDTECH",
          subIndustry: "Study tools",
          foundedYear: 2026,
          registrationStatus: "NOT_REGISTERED",
          headquarters: "Jaipur, India",
          businessModelSummary: MY_STARTUP.businessModelSummary,
          mission: MY_STARTUP.mission,
          vision: MY_STARTUP.vision,
          problemStatement: MY_STARTUP.problemStatement,
          solution: MY_STARTUP.solution,
          uniqueValueProposition: "Re-plans every night from what the student actually did (demo).",
        },
        product: { productName: "Demo Planner", description: "Web and Android app.", currentVersion: "0.4 beta", technologyStack: ["Next.js", "Python", "PostgreSQL"], screenshots: [], hasApi: false },
        market: {
          targetAudience: "College students in tier-2 cities",
          targetGeography: "India",
          primaryCustomer: "Colleges",
          customerModel: ["B2B2C"],
          tamAmount: 5_000_000_000,
          samAmount: 600_000_000,
          somAmount: 30_000_000,
          competitors: ["Paper planners", "Generic to-do apps"],
          competitiveAdvantage: "Built around the syllabus, not a blank calendar.",
          goToMarketStrategy: "Pilot with colleges, then sell per seat.",
        },
        team: {
          teamSize: 3,
          hiringStatus: "OPEN_TO_ADVISORS",
          openRoles: [],
          members: MY_STARTUP.teamMembers.map(({ category, fullName, role: memberRole }) => ({ category, fullName, role: memberRole })),
        },
        traction: { totalUsers: 240, growthRatePercent: 18, retentionRatePercent: 58, partnerships: ["Two demo colleges"] },
        funding: { fundingTypes: ["ANGEL"], currentRaiseAmount: 2_500_000, fundingGoalAmount: 2_500_000, useOfFunds: "Two engineers and college pilots (demo).", runwayMonths: 6 },
        verification: { documents: [] },
        preferences: { lookingFor: ["INVESTORS", "MENTORS", "INCUBATORS"] },
      };
    case "investor":
      return {
        personalDetails,
        investorInfo: {
          firmName: MY_INVESTOR.firmName,
          designation: MY_INVESTOR.designation,
          investorType: MY_INVESTOR.investorType,
          bio: MY_INVESTOR.bio,
          preferredIndustries: MY_INVESTOR.preferredIndustries,
          preferredStages: MY_INVESTOR.preferredStages,
          checkSizeMinAmount: MY_INVESTOR.checkSizeMinAmount,
          checkSizeMaxAmount: MY_INVESTOR.checkSizeMaxAmount,
          preferredGeography: MY_INVESTOR.preferredGeography,
          location: MY_INVESTOR.location,
          portfolioCompanies: MY_INVESTOR.portfolioCompanies,
          investmentThesis: MY_INVESTOR.investmentThesis,
          openForPitches: true,
        },
      };
    case "mentor": {
      const m = MENTORS[0]!;
      return {
        personalDetails,
        mentorInfo: {
          headline: m.headline,
          expertise: m.expertise,
          industries: m.industries,
          yearsExperience: m.yearsExperience,
          availability: m.availability,
          sessionTypes: m.sessionTypes,
          pricingModel: m.pricingModel,
          languages: m.languages,
          pastStartups: [],
        },
      };
    }
    case "incubator": {
      const i = INCUBATORS[0]!;
      return {
        personalDetails,
        incubatorInfo: {
          organizationName: i.organizationName,
          description: i.description,
          industries: i.industries,
          portfolioCompanies: i.portfolioCompanies,
          affiliatedMentorCount: i.affiliatedMentorCount,
          kind: i.kind,
          programs: i.programs.map((p) => ({
            name: p.name,
            description: p.description,
            durationWeeks: p.durationWeeks,
            eligibilityCriteria: p.eligibilityCriteria,
            applicationCycleStart: p.applicationCycleStart?.slice(0, 10),
            applicationCycleEnd: p.applicationCycleEnd?.slice(0, 10),
          })),
        },
      };
    }
    case "university": {
      const u = UNIVERSITIES[0]!;
      return {
        personalDetails,
        universityInfo: {
          institutionName: u.institutionName,
          affiliationType: u.affiliationType,
          incubationCellName: u.incubationCellName,
          departments: u.departments,
          programsOffered: u.programsOffered,
        },
      };
    }
    default:
      return { personalDetails };
  }
}
