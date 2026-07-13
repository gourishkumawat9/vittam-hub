import {
  Bot,
  Briefcase,
  Building,
  DoorOpen,
  GraduationCap,
  Handshake,
  Landmark,
  Rocket,
  TrendingUp,
  UserSearch,
  Users,
} from "lucide-react";
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
  { id: "service-providers", label: "Service providers", icon: Briefcase },
  { id: "government", label: "Government", icon: Landmark },
  { id: "job-seekers", label: "Job seekers", icon: UserSearch },
  { id: "office-spaces", label: "Office spaces", icon: DoorOpen },
  { id: "ai-assistant", label: "AI Assistant", icon: Bot },
];
