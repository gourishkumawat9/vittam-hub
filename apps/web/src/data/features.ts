import { Compass, GraduationCap, MessageSquare, Rocket } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PlatformFeature {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/**
 * What the platform does today, in the four areas it is focused on first
 * (the owner's call, November 2026): startups, investors, mentors and the
 * founder community. Paused or not yet live work (Startup Passport, the
 * timeline, incubator and university tools) is left out until it ships.
 */
export const PLATFORM_FEATURES: PlatformFeature[] = [
  {
    id: "profile",
    title: "Startup profile",
    description: "One page with what you do, your stage and what you need. Set up in about five minutes, add the rest later.",
    icon: Rocket,
  },
  {
    id: "investors",
    title: "Investor connect",
    description: "Find investors by stage, industry and cheque size, then reach them with a connect request, not a cold email.",
    icon: Compass,
  },
  {
    id: "mentorship",
    title: "Mentorship",
    description: "Request a session with mentors who have built and scaled in your space, and keep every conversation in one place.",
    icon: GraduationCap,
  },
  {
    id: "community",
    title: "Community",
    description: "Founder updates, questions and events in one focused feed.",
    icon: MessageSquare,
  },
];
