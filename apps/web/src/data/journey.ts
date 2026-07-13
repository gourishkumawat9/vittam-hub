export interface JourneyStage {
  id: string;
  label: string;
  description: string;
  howVittamHelps: string;
}

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "idea",
    label: "Idea",
    description: "Shaping the problem, the vision, and the founding team.",
    howVittamHelps: "Start your Startup Passport early and get matched with mentors who've validated similar ideas.",
  },
  {
    id: "validation",
    label: "Validation",
    description: "Talking to users and confirming the problem is real and worth solving.",
    howVittamHelps: "Access validation frameworks in the Learning Hub and connect with founders one stage ahead.",
  },
  {
    id: "prototype",
    label: "Prototype",
    description: "Building the first tangible version to test with real users.",
    howVittamHelps: "Find a co-founder or freelance designer/developer through Team Builder to ship faster.",
  },
  {
    id: "mvp",
    label: "MVP",
    description: "Launching a minimum viable product into the market.",
    howVittamHelps: "Get your first Trust Score baseline and start building a public, verifiable track record.",
  },
  {
    id: "customers",
    label: "Customers",
    description: "Landing your first paying or active users.",
    howVittamHelps: "Showcase real traction on your public profile — visible to investors watching your stage.",
  },
  {
    id: "revenue",
    label: "Revenue",
    description: "Turning traction into a repeatable, growing revenue engine.",
    howVittamHelps: "Unlock investor discovery — get matched to funds actively deploying at your revenue stage.",
  },
  {
    id: "funding",
    label: "Funding",
    description: "Raising capital to accelerate growth.",
    howVittamHelps: "Get discovered directly by verified investors filtering for your industry and check size.",
  },
  {
    id: "scale",
    label: "Scale",
    description: "Expanding into new markets, teams, and product lines.",
    howVittamHelps: "Tap the Office Marketplace and Team Builder to expand into new cities without the friction.",
  },
  {
    id: "unicorn",
    label: "Unicorn",
    description: "Reaching category-defining scale and valuation.",
    howVittamHelps: "Your full journey — from idea to unicorn — stays documented as the definitive record.",
  },
];
