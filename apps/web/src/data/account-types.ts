import { MemberPersona, PERSONA_ROLE, type PersonaGroup, type RegisterableRole } from "@vittamhub/types";
import { Building2, GraduationCap, Handshake, Landmark, Lightbulb, Rocket, School, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PersonaOption {
  persona: MemberPersona;
  role: RegisterableRole;
  group: PersonaGroup;
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * "Who are you?", the BHASKAR way: first whether you're joining as an
 * individual or for an organisation, then which kind. Several choices open
 * the same dashboard (a student and someone exploring an idea are founders;
 * a fund is an investor; an accelerator is an incubator), and the persona
 * words the onboarding for them. See docs/13-signup-questions.md.
 */
export const PERSONA_OPTIONS: PersonaOption[] = [
  {
    persona: MemberPersona.STARTUP_FOUNDER,
    role: PERSONA_ROLE.STARTUP_FOUNDER,
    group: "INDIVIDUAL",
    icon: Rocket,
    title: "Startup founder",
    description: "You're building a startup, registered or not yet.",
  },
  {
    persona: MemberPersona.EXPLORER,
    role: PERSONA_ROLE.EXPLORER,
    group: "INDIVIDUAL",
    icon: Lightbulb,
    title: "Exploring an idea",
    description: "You have an idea and want to test it before you build.",
  },
  {
    persona: MemberPersona.STUDENT,
    role: PERSONA_ROLE.STUDENT,
    group: "INDIVIDUAL",
    icon: Sparkles,
    title: "Student",
    description: "You're studying and want to start something.",
  },
  {
    persona: MemberPersona.MENTOR,
    role: PERSONA_ROLE.MENTOR,
    group: "INDIVIDUAL",
    icon: GraduationCap,
    title: "Mentor",
    description: "You guide founders, free or for a fee.",
  },
  {
    persona: MemberPersona.INDIVIDUAL_INVESTOR,
    role: PERSONA_ROLE.INDIVIDUAL_INVESTOR,
    group: "INDIVIDUAL",
    icon: Handshake,
    title: "Angel investor",
    description: "You invest your own money in startups.",
  },
  {
    persona: MemberPersona.INVESTMENT_FIRM,
    role: PERSONA_ROLE.INVESTMENT_FIRM,
    group: "ORGANISATION",
    icon: Landmark,
    title: "Investment firm or fund",
    description: "A VC fund, family office, corporate VC or angel network.",
  },
  {
    persona: MemberPersona.INCUBATOR,
    role: PERSONA_ROLE.INCUBATOR,
    group: "ORGANISATION",
    icon: Building2,
    title: "Incubator",
    description: "You run an incubation programme for early startups.",
  },
  {
    persona: MemberPersona.ACCELERATOR,
    role: PERSONA_ROLE.ACCELERATOR,
    group: "ORGANISATION",
    icon: Users,
    title: "Accelerator",
    description: "You run a cohort-based programme for startups ready to grow.",
  },
  {
    persona: MemberPersona.INSTITUTION,
    role: PERSONA_ROLE.INSTITUTION,
    group: "ORGANISATION",
    icon: School,
    title: "University or institution",
    description: "A university, college or institute with an E-cell or incubator.",
  },
];

export const PERSONA_GROUPS: { group: PersonaGroup; title: string; description: string }[] = [
  { group: "INDIVIDUAL", title: "As an individual", description: "You're joining for yourself." },
  { group: "ORGANISATION", title: "For an organisation", description: "You're setting up a page for a fund, incubator or institution." },
];

/**
 * The persona a marketing link asks for. Links say `?role=investor` (lower
 * case) or `?persona=student`; anything unknown opens the picker.
 */
export function personaFromQuery(params: { role?: string | null; persona?: string | null }): PersonaOption | null {
  const persona = params.persona?.toUpperCase();
  if (persona) {
    const match = PERSONA_OPTIONS.find((option) => option.persona === persona);
    if (match) return match;
  }
  const role = params.role?.toUpperCase();
  if (!role) return null;
  // A role alone means its first, most common persona.
  return PERSONA_OPTIONS.find((option) => option.role === role) ?? null;
}
