import { Award, Building2, Compass, GraduationCap, MessageSquare, ShieldCheck, Timer, Users, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PlatformFeature {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const PLATFORM_FEATURES: PlatformFeature[] = [
  { id: "passport", title: "Startup Passport", description: "One verified profile documenting your entire journey, no more scattered decks.", icon: Wallet },
  { id: "trust-score", title: "Trust Score", description: "A transparent, data-backed signal of credibility for investors and partners.", icon: Award },
  { id: "verification", title: "Verification", description: "Automated identity and company checks, with every profile's verification status shown openly.", icon: ShieldCheck },
  { id: "discovery", title: "Investor Discovery", description: "Find investors by stage, industry and cheque size, then reach them with a connect request, not a cold email.", icon: Compass },
  { id: "mentorship", title: "Mentorship", description: "Connect with mentors who've built and scaled in your exact space.", icon: Users },
  { id: "incubators", title: "Incubators", description: "Find incubation and acceleration programmes that take startups at your stage.", icon: Building2 },
  { id: "universities", title: "Universities", description: "Reach university startup cells and the student founders they support.", icon: GraduationCap },
  { id: "timeline", title: "Startup Timeline", description: "A living record of milestones, funding, and growth, always up to date.", icon: Timer },
  { id: "community", title: "Community", description: "Founder updates, announcements, and events in one focused feed.", icon: MessageSquare },
];
