import { Building, GraduationCap, Handshake, MessagesSquare, Rocket, TrendingUp, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface EcosystemNode {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const ECOSYSTEM_NODES: EcosystemNode[] = [
  { id: "startups", label: "Startups", icon: Rocket },
  { id: "investors", label: "Investors", icon: Handshake },
  { id: "mentors", label: "Mentors", icon: Users },
  { id: "universities", label: "Universities", icon: GraduationCap },
  { id: "incubators", label: "Incubators", icon: Building },
  { id: "accelerators", label: "Accelerators", icon: TrendingUp },
  { id: "community", label: "Community", icon: MessagesSquare },
];
