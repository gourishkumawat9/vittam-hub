import { z } from "zod";

/**
 * Learning Hub topics — infrastructure only, no lesson content generated.
 * Structurally identical to FUTURE_MODULES: nothing here is dynamic yet (no
 * content, no per-user progress, no admin editing), so a const array is
 * strictly simpler than a DB table + seed script + CRUD surface for zero
 * write-path benefit today. Promote to a real table when there's actual
 * dynamic data to store (lesson content, progress tracking).
 */
export const LEARNING_TOPICS = [
  { slug: "idea-validation", label: "Idea Validation", description: "Test demand before you build." },
  { slug: "product-market-fit", label: "Product Market Fit", description: "Know when you've found it, and what to do next." },
  { slug: "pitch-deck", label: "Pitch Deck", description: "Structure a deck investors actually read." },
  { slug: "fundraising", label: "Fundraising", description: "Cap tables, term sheets, and investor outreach." },
  { slug: "hiring", label: "Hiring", description: "Build your founding team and first hires." },
  { slug: "legal", label: "Legal", description: "Incorporation, equity, and compliance basics." },
  { slug: "marketing", label: "Marketing", description: "Positioning, channels, and early growth loops." },
  { slug: "finance", label: "Finance", description: "Runway planning, unit economics, forecasting." },
  { slug: "growth", label: "Growth", description: "Retention, expansion, and repeatable growth loops." },
  { slug: "leadership", label: "Leadership", description: "Leading a team through every stage of scale." },
  { slug: "ai-for-startups", label: "AI for Startups", description: "Practical AI adoption for early-stage teams." },
] as const;

export const learningTopicSlugSchema = z.enum(
  LEARNING_TOPICS.map((topic) => topic.slug) as [(typeof LEARNING_TOPICS)[number]["slug"], ...string[]],
);
export type LearningTopicSlug = z.infer<typeof learningTopicSlugSchema>;
