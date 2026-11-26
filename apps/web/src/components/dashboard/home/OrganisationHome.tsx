"use client";

import { useFollowers, useMyVerification } from "@vittamhub/api-client";
import { Button, Card } from "@vittamhub/ui";
import { Building2, GraduationCap, School, Users } from "lucide-react";
import Link from "next/link";

import { editProfileLink } from "@/lib/role-home";

import { PageHeader } from "../PageHeader";
import { ProfileStrengthCard } from "../ProfileStrengthCard";
import { type Stat, StatStrip } from "../StatStrip";
import { VerificationChecklist } from "../VerificationChecklist";

import { CommunityPreview } from "./CommunityPreview";

const COPY: Record<string, { title: string; description: string; postHint: string; directory: string }> = {
  INCUBATOR: {
    directory: "incubator directory",
    title: "Incubator home",
    description: "Your programme's page on VittamHub. Founders can find it in the incubator directory.",
    postHint: "Announce an open call or a demo day so founders hear about it.",
  },
  UNIVERSITY: {
    directory: "university directory",
    title: "University home",
    description: "Your campus page on VittamHub. Student founders can find it in the university directory.",
    postHint: "Share an E-cell event or a programme for student founders.",
  },
};

const DIRECTORY_LINKS = [
  { href: "/mentors", label: "Mentors", hint: "People who give founders their time", icon: GraduationCap },
  { href: "/incubators", label: "Incubators", hint: "Programmes and their open calls", icon: Building2 },
  { href: "/universities", label: "Universities", hint: "Campuses and their E-cells", icon: School },
  { href: "/community", label: "Community", hint: "Posts, events and announcements", icon: Users },
];

/**
 * A simple, tidy home for incubators and universities while the platform
 * focuses on mentors and founders: profile status, the ecosystem directories
 * and the community. Deeper tools (cohorts, applications) come later.
 */
export function OrganisationHome({ role }: { role: string }) {
  const copy = COPY[role] ?? {
    title: "Home",
    description: "Your page on VittamHub.",
    postHint: "Share an update with the community.",
    directory: "directory",
  };
  const profile = editProfileLink(role);
  const { data: followers } = useFollowers();
  const { data: verification, isLoading: verificationLoading } = useMyVerification();

  // Every published profile is listed from the start; verified ones are shown first (CLAUDE.md §7a).
  const listing: Stat = verificationLoading
    ? { label: "Directory listing", value: "…" }
    : !verification
      ? { label: "Directory listing", value: "Not published", hint: "Finish your profile to appear in the directory", href: profile?.href }
      : verification.status === "VERIFIED"
        ? { label: "Directory listing", value: "Verified", hint: `Shown first in the ${copy.directory}` }
        : { label: "Directory listing", value: "Listed", hint: "Verified profiles are shown first", href: "/settings#verification" };

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <>
            {profile && (
              <Button variant="secondary" size="sm" asChild>
                <Link href={profile.href}>{profile.label}</Link>
              </Button>
            )}
            <Button size="sm" asChild>
              <Link href="/community">Post to the community</Link>
            </Button>
          </>
        }
      />

      <StatStrip
        stats={[listing, { label: "Followers", value: followers?.length ?? "…", hint: "Members who follow your updates" }]}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="flex flex-col gap-4">
            <h2 className="title-3">Explore the ecosystem</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {DIRECTORY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex h-full items-start gap-3 rounded-button border border-border p-4 transition-colors duration-300 ease-base hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-white/5"
                  >
                    <link.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700 dark:text-brand-300" aria-hidden="true" />
                    <span className="flex flex-col gap-1">
                      <span className="body-4 text-text-primary">{link.label}</span>
                      <span className="caption-5">{link.hint}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <CommunityPreview emptyHint={copy.postHint} />
        </div>
        <div className="flex flex-col gap-6">
          <ProfileStrengthCard />
          <VerificationChecklist />
        </div>
      </div>
    </div>
  );
}
