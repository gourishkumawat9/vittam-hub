import { UserRole, type RegisterableRole } from "@vittamhub/types";
import { Briefcase, Building2, GraduationCap, Handshake, Rocket, School, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AccountTypeOption {
  role: RegisterableRole;
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
}

export const ACCOUNT_TYPES: AccountTypeOption[] = [
  {
    role: UserRole.FOUNDER,
    icon: Rocket,
    title: "Startup Founder",
    description: "Build your verified digital identity and get discovered by investors.",
    benefits: ["Showcase your startup journey", "Get matched to verified investors", "Access mentors & incubators"],
  },
  {
    role: UserRole.INVESTOR,
    icon: Handshake,
    title: "Investor",
    description: "Discover verified startups matched to your investment thesis.",
    benefits: ["Curated deal flow by stage & industry", "Verified founder profiles", "Direct connection requests"],
  },
  {
    role: UserRole.MENTOR,
    icon: GraduationCap,
    title: "Mentor",
    description: "Share your expertise with the next generation of founders.",
    benefits: ["Set your own availability", "Build a public mentor reputation", "Flexible session pricing"],
  },
  {
    role: UserRole.INCUBATOR,
    icon: Building2,
    title: "Incubator / Accelerator",
    description: "Showcase your programs, application cycles, and portfolio.",
    benefits: ["List programs & application cycles", "Attract high-quality applicants", "Showcase your portfolio"],
  },
  {
    role: UserRole.UNIVERSITY,
    icon: School,
    title: "University / Institution",
    description: "Connect your students and incubation cell to the ecosystem.",
    benefits: ["Promote your incubation cell", "Connect students to opportunities", "Showcase academic programs"],
  },
  {
    role: UserRole.SERVICE_PROVIDER,
    icon: Wrench,
    title: "Service Provider",
    description: "Offer legal, finance, marketing, and more to startups.",
    benefits: ["List your service categories", "Reach startups actively seeking help", "Build client credibility"],
  },
  {
    role: UserRole.JOB_SEEKER,
    icon: Briefcase,
    title: "Job Seeker",
    description: "Find your next role at a verified, high-growth startup.",
    benefits: ["Showcase skills & experience", "Get matched to relevant roles", "Direct visibility to founders"],
  },
];
