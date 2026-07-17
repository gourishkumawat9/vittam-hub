import { z } from "zod";

/**
 * Modules explicitly scoped OUT of the MVP — placeholder routes, nav entries,
 * and a consistent "not available yet" API contract exist for every one of
 * these so a future prompt can implement a module by replacing its
 * placeholder, not by inventing new plumbing. No business logic lives here
 * by design; see docs/13-dashboard-architecture.md.
 */
export const FUTURE_MODULES = [
  { slug: "startup-passport", label: "Startup Passport", description: "A portable, verifiable identity for your startup across the ecosystem." },
  { slug: "ai-assistant", label: "AI Assistant", description: "An AI copilot for founders across the platform." },
  { slug: "investor-crm", label: "Investor CRM", description: "Track and manage your investor relationships and pipeline." },
  { slug: "growth-dashboard", label: "Growth Dashboard", description: "Visualize user, revenue, and engagement growth over time." },
  { slug: "financial-dashboard", label: "Financial Dashboard", description: "Runway, burn rate, and financial health at a glance." },
  { slug: "startup-analytics", label: "Startup Analytics", description: "Deeper analytics on your profile's reach and investor interest." },
  { slug: "office-marketplace", label: "Office Marketplace", description: "Find coworking, private offices, and meeting rooms." },
  { slug: "government-schemes", label: "Government Schemes", description: "Discover schemes and incentives your startup may qualify for." },
  { slug: "grants", label: "Grants", description: "Browse and track applications to startup grants." },
  // AI-* entries: when one of these ships for real, follow CaptchaService's
  // pattern (apps/api/src/modules/auth/services/captcha.service.ts) — a real
  // provider call when an API key is configured, a graceful no-op/skip when
  // it isn't, never a hard block on the flow it sits in.
  { slug: "ai-startup-review", label: "AI Startup Review", description: "Automated feedback on your startup profile and positioning." },
  { slug: "ai-investor-matching", label: "AI Investor Matching", description: "AI-ranked investor recommendations based on your startup." },
  { slug: "ai-pitch-deck-review", label: "AI Pitch Deck Review", description: "Automated feedback on your uploaded pitch deck." },
  { slug: "subscription-plans", label: "Subscription Plans", description: "Upgrade your plan for higher limits and premium features." },
  { slug: "payment-gateway", label: "Payment Gateway", description: "Billing and payments for subscriptions and marketplace transactions." },
  { slug: "startup-marketplace", label: "Startup Marketplace", description: "Buy, sell, or invest in startup equity and assets." },
  { slug: "vendor-marketplace", label: "Vendor Marketplace", description: "Discover vetted vendors and service providers." },
  { slug: "mobile-app", label: "Mobile App", description: "VittamHub, natively, on iOS and Android." },
  { slug: "api-integrations", label: "API Integrations", description: "Connect VittamHub to the other tools in your stack." },
  { slug: "ai-due-diligence", label: "AI Due Diligence", description: "Automated red-flag checks across a startup's documents and metrics." },
  { slug: "ai-risk-analysis", label: "AI Risk Analysis", description: "Modeled risk scoring for a prospective investment." },
  { slug: "portfolio-prediction", label: "Portfolio Prediction", description: "Forecasted returns and outcomes across your portfolio." },
  { slug: "fund-performance", label: "Fund Performance", description: "Fund-level IRR, multiples, and benchmarking." },
  { slug: "syndicate-investing", label: "Syndicate Investing", description: "Pool capital with other investors on a single deal." },
  { slug: "secondary-market", label: "Secondary Market", description: "Buy or sell existing stakes in startups." },
  { slug: "cross-border-investments", label: "Cross-Border Investments", description: "Compliant investing across international jurisdictions." },
  { slug: "government-api", label: "Government API", description: "Live verification against government registries." },
  { slug: "kyc-apis", label: "KYC APIs", description: "Automated identity verification for investors and founders." },
  { slug: "ai-startup-advisor", label: "AI Startup Advisor", description: "Personalized, ongoing guidance for founders at every stage." },
  { slug: "portfolio-analytics", label: "Portfolio Analytics", description: "Deeper analytics across an investor's full portfolio." },
  { slug: "referral-program", label: "Referral Program", description: "Invite founders or investors and earn platform benefits." },
  { slug: "founder-programs", label: "Founder Programs", description: "Structured cohort programs run directly on VittamHub." },
  // Events/Hackathons are intentionally NOT a future-module slug — they're
  // already real today via Community's PostType.EVENT + EventRsvp, not a
  // placeholder.
] as const;

export const futureModuleSlugSchema = z.enum(
  FUTURE_MODULES.map((module) => module.slug) as [(typeof FUTURE_MODULES)[number]["slug"], ...string[]],
);
export type FutureModuleSlug = z.infer<typeof futureModuleSlugSchema>;

export const futureModuleStatusSchema = z.object({
  slug: futureModuleSlugSchema,
  label: z.string(),
  description: z.string(),
  available: z.literal(false),
});
export type FutureModuleStatus = z.infer<typeof futureModuleStatusSchema>;
