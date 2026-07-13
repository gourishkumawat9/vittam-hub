import {
  Award,
  Bot,
  Briefcase,
  Building2,
  Compass,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Timer,
  UserSearch,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PlatformFeature {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const PLATFORM_FEATURES: PlatformFeature[] = [
  { id: "passport", title: "Startup Passport", description: "One verified profile documenting your entire journey — no more scattered decks.", icon: Wallet },
  { id: "trust-score", title: "Trust Score", description: "A transparent, data-backed signal of credibility for investors and partners.", icon: Award },
  { id: "verification", title: "Verification", description: "Human-reviewed identity checks so every profile you see is real.", icon: ShieldCheck },
  { id: "discovery", title: "Investor Discovery", description: "Get matched to investors by stage, industry, and check size — not cold email.", icon: Compass },
  { id: "mentorship", title: "Mentorship", description: "Connect with mentors who've built and scaled in your exact space.", icon: Users },
  { id: "timeline", title: "Startup Timeline", description: "A living record of milestones, funding, and growth — always up to date.", icon: Timer },
  { id: "community", title: "Community", description: "Founder updates, announcements, and events in one focused feed.", icon: MessageSquare },
  { id: "learning", title: "Learning Hub", description: "Structured tracks on fundraising, finance, legal, product, and sales.", icon: Sparkles },
  { id: "jobs", title: "Jobs", description: "Find your next hire or your next role inside a vetted startup network.", icon: Briefcase },
  { id: "team-builder", title: "Team Builder", description: "Find co-founders, developers, designers, and advisors who fit.", icon: UserSearch },
  { id: "office", title: "Office Marketplace", description: "Book coworking, private, and virtual offices in any city you're building in.", icon: Building2 },
  { id: "ai-assistant", title: "AI Assistant", description: "Get instant guidance on your profile, pitch, and next milestone.", icon: Bot },
];
