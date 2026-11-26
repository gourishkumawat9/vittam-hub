import type { PlatformFeature } from "./features";

export interface JourneyStage {
  id: string;
  label: string;
  description: string;
  howVittamHelps: string;
  /** The parts of VittamHub a founder leans on most at this stage. */
  uses: PlatformFeature["id"][];
}

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "idea",
    label: "Idea",
    description: "Shaping the problem, the vision, and the founding team.",
    howVittamHelps: "Start your profile early and find mentors who know your space.",
    uses: ["profile", "mentorship", "community"],
  },
  {
    id: "validation",
    label: "Validation",
    description: "Talking to users and confirming the problem is real and worth solving.",
    howVittamHelps: "Get feedback from mentors and from founders one stage ahead in the community.",
    uses: ["mentorship", "community"],
  },
  {
    id: "prototype",
    label: "Prototype",
    description: "Building the first tangible version to test with real users.",
    howVittamHelps: "Get product feedback from mentors who have built in your space.",
    uses: ["mentorship", "community"],
  },
  {
    id: "mvp",
    label: "MVP",
    description: "Launching a minimum viable product into the market.",
    howVittamHelps: "Publish your startup profile and start a dated, public record of your progress.",
    uses: ["profile", "mentorship", "community"],
  },
  {
    id: "customers",
    label: "Customers",
    description: "Landing your first paying or active users.",
    howVittamHelps: "Show real traction on your profile, where investors filtering for your stage can find it.",
    uses: ["profile", "community"],
  },
  {
    id: "revenue",
    label: "Revenue",
    description: "Turning traction into a repeatable, growing revenue engine.",
    howVittamHelps: "Add revenue milestones and reach investors who back your stage through connect requests.",
    uses: ["profile", "investors"],
  },
  {
    id: "funding",
    label: "Funding",
    description: "Raising capital to accelerate growth.",
    howVittamHelps: "Send connect requests to investors whose stage, industry and cheque size fit your round.",
    uses: ["investors", "profile"],
  },
  {
    id: "scale",
    label: "Scale",
    description: "Expanding into new markets, teams, and product lines.",
    howVittamHelps: "Keep investors and your network updated on every new market through milestones and community posts.",
    uses: ["investors", "community"],
  },
  {
    id: "unicorn",
    label: "Unicorn",
    description: "Reaching category-defining scale and valuation.",
    howVittamHelps: "Your whole journey, from idea to unicorn, stays documented in one place.",
    uses: ["profile", "investors", "community"],
  },
];
