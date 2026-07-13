import { Compass, Megaphone, Palette, Terminal, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface TeamRole {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const TEAM_ROLES: TeamRole[] = [
  { id: "cofounder", title: "Find a co-founder", description: "Match with builders who complement your skillset.", icon: UsersRound },
  { id: "developer", title: "Hire a developer", description: "Vetted engineers available for full-time or contract work.", icon: Terminal },
  { id: "designer", title: "Hire a designer", description: "Product and brand designers who've shipped at early stage.", icon: Palette },
  { id: "marketing", title: "Hire marketing", description: "Growth and content specialists who understand startups.", icon: Megaphone },
  { id: "advisor", title: "Find advisors", description: "Domain experts to guide strategy and unlock intros.", icon: Compass },
];
