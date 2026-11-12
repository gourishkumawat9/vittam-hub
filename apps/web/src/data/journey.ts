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
    howVittamHelps: "Start your profile early and find mentors who know your space.",
  },
  {
    id: "validation",
    label: "Validation",
    description: "Talking to users and confirming the problem is real and worth solving.",
    howVittamHelps: "Get feedback from mentors and from founders one stage ahead in the community.",
  },
  {
    id: "prototype",
    label: "Prototype",
    description: "Building the first tangible version to test with real users.",
    howVittamHelps: "Get product feedback from mentors and find incubation programmes that take early-stage startups.",
  },
  {
    id: "mvp",
    label: "MVP",
    description: "Launching a minimum viable product into the market.",
    howVittamHelps: "Get your first Trust Score and start a dated, public record of your progress.",
  },
  {
    id: "customers",
    label: "Customers",
    description: "Landing your first paying or active users.",
    howVittamHelps: "Show real traction on your profile, where investors filtering for your stage can find it.",
  },
  {
    id: "revenue",
    label: "Revenue",
    description: "Turning traction into a repeatable, growing revenue engine.",
    howVittamHelps: "Add revenue milestones and reach investors who back your stage through connect requests.",
  },
  {
    id: "funding",
    label: "Funding",
    description: "Raising capital to accelerate growth.",
    howVittamHelps: "Send connect requests to investors whose stage, industry and cheque size fit your round.",
  },
  {
    id: "scale",
    label: "Scale",
    description: "Expanding into new markets, teams, and product lines.",
    howVittamHelps: "Keep investors and your network updated on every new market through milestones and community posts.",
  },
  {
    id: "unicorn",
    label: "Unicorn",
    description: "Reaching category-defining scale and valuation.",
    howVittamHelps: "Your whole journey, from idea to unicorn, stays documented in one place.",
  },
];
