export interface StartupCard {
  id: string;
  name: string;
  tagline: string;
  industry: string;
  location: string;
  stage: "Idea" | "MVP" | "Revenue" | "Funded" | "Scaling";
  trustScore: number;
  followers: number;
  initials: string;
}

/**
 * Illustrative placeholder profiles — not real companies. Swap for a live
 * `useStartupSearch()` feed (see @vittamhub/api-client) once discovery ranking
 * ships; see docs/07-backend-architecture.md.
 */
export const FEATURED_STARTUPS: StartupCard[] = [
  {
    id: "1",
    name: "Nimbus Health",
    tagline: "AI-assisted diagnostics for rural clinics.",
    industry: "HealthTech",
    location: "Bengaluru, IN",
    stage: "Funded",
    trustScore: 92,
    followers: 1840,
    initials: "NH",
  },
  {
    id: "2",
    name: "Ledgerly",
    tagline: "Real-time bookkeeping for small businesses.",
    industry: "FinTech",
    location: "Austin, US",
    stage: "Revenue",
    trustScore: 87,
    followers: 962,
    initials: "LG",
  },
  {
    id: "3",
    name: "Cropwise",
    tagline: "Satellite-driven yield forecasting for farmers.",
    industry: "AgriTech",
    location: "Nairobi, KE",
    stage: "MVP",
    trustScore: 78,
    followers: 511,
    initials: "CW",
  },
  {
    id: "4",
    name: "Verto Learn",
    tagline: "Adaptive learning paths for vocational skills.",
    industry: "EdTech",
    location: "Manila, PH",
    stage: "Revenue",
    trustScore: 84,
    followers: 703,
    initials: "VL",
  },
  {
    id: "5",
    name: "GridSense",
    tagline: "Predictive maintenance for renewable microgrids.",
    industry: "ClimateTech",
    location: "Berlin, DE",
    stage: "Funded",
    trustScore: 90,
    followers: 1320,
    initials: "GS",
  },
  {
    id: "6",
    name: "Parcelly",
    tagline: "Last-mile delivery routing for local couriers.",
    industry: "Logistics",
    location: "São Paulo, BR",
    stage: "Idea",
    trustScore: 61,
    followers: 204,
    initials: "PC",
  },
];
