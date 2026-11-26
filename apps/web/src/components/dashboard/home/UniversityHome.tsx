"use client";

import { useFollowers, useMyUniversityProfile, useMyVerification } from "@vittamhub/api-client";
import { Badge, Button, Card, Skeleton } from "@vittamhub/ui";
import { ArrowRight, BarChart3, Building2, CalendarDays, GraduationCap, Lightbulb, School } from "lucide-react";
import Link from "next/link";

import { VerifiedBadge } from "@/components/VerifiedBadge";
import { INSTITUTION_TYPE_LABEL } from "@/lib/signup-options";

import { PageHeader, PanelLink, PanelTitle } from "../PageHeader";
import { ProfileStrengthCard } from "../ProfileStrengthCard";
import { type Stat, StatStrip } from "../StatStrip";
import { VerificationChecklist } from "../VerificationChecklist";
import { OpenCallsCard } from "../incubator/OpenCallsCard";
import { UniversityProfilePreview } from "../university/UniversityProfilePreview";

import { CommunityPreview } from "./CommunityPreview";
import { StartHere } from "./StartHere";

/** Ways a campus cell can help its student founders, each a link to where it's done. */
const SUPPORT_FOUNDERS = [
  {
    href: "/community?compose=event",
    icon: CalendarDays,
    label: "Post an E-cell event or a hackathon",
    hint: "Events show under Upcoming events on the community page",
  },
  {
    href: "/community?compose=poll",
    icon: BarChart3,
    label: "Ask students what help they need",
    hint: "A quick poll on the community feed",
  },
  {
    href: "/mentors",
    icon: GraduationCap,
    label: "Point students to mentors",
    hint: "Founders can request a session with their question",
  },
  {
    href: "/incubators",
    icon: Building2,
    label: "Show them where to go next",
    hint: "Incubators and accelerators, with their open calls",
  },
];

/**
 * The university's home, built around its startup cell: the programmes it
 * runs for student founders, how the campus page looks and what's missing,
 * ways to support students, and incubator calls they could apply to next.
 */
export function UniversityHome() {
  const { data: university, isLoading } = useMyUniversityProfile();
  const { data: followers } = useFollowers();
  const { data: verification, isLoading: verificationLoading } = useMyVerification();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-16 w-80 max-w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 w-full lg:col-span-2" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  const programmes = university?.programsOffered ?? [];

  // Every published profile is listed from the start; verified ones are shown first (CLAUDE.md §7a).
  const listing: Stat = verificationLoading
    ? { label: "Directory listing", value: "…" }
    : !university
      ? { label: "Directory listing", value: "Not published", hint: "Finish your profile to appear", href: "/onboarding/university" }
      : university.verificationStatus === "VERIFIED" || verification?.status === "VERIFIED"
        ? { label: "Directory listing", value: "Verified", hint: "Shown first in the university directory" }
        : { label: "Directory listing", value: "Listed", hint: "Verified profiles are shown first", href: "/settings#verification" };

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title={university?.institutionName ?? "University home"}
        meta={
          university && (
            <>
              {university.affiliationType && <Badge variant="neutral">{INSTITUTION_TYPE_LABEL[university.affiliationType] ?? university.affiliationType}</Badge>}
              <VerifiedBadge status={university.verificationStatus} />
            </>
          )
        }
        description={
          university
            ? `Your campus page on VittamHub. Student founders find ${university.incubationCellName ?? "your startup cell"} in the university directory.`
            : "Publish your campus profile and student founders can find your startup cell in the directory."
        }
        actions={
          <>
            {university && (
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/universities/${university.id}`}>View public page</Link>
              </Button>
            )}
            <Button size="sm" asChild>
              <Link href={university ? "/community?compose=event" : "/onboarding/university"}>
                {university ? "Post a campus event" : "Finish your profile"}
              </Link>
            </Button>
          </>
        }
      />

      {!university && (
        <StartHere
          steps={[
            {
              title: "Publish your campus profile",
              hint: "Your startup cell, the departments behind it and what you run for students.",
              href: "/onboarding/university",
              cta: "Finish profile",
              done: false,
            },
            {
              title: "List your programmes",
              hint: "Incubation, ideation sprints, project-to-startup tracks: whatever students can join.",
              href: "/onboarding/university",
              cta: "Add programmes",
              done: false,
            },
            {
              title: "Post your next event",
              hint: "A talk, a hackathon or a demo day, so students hear about it.",
              href: "/community?compose=event",
              cta: "Post an event",
              done: false,
            },
          ]}
        />
      )}

      <StatStrip
        stats={[
          { label: "Programmes", value: programmes.length, hint: "For student founders" },
          listing,
          { label: "Followers", value: followers?.length ?? "…", hint: "Members who see your posts" },
          { label: "Departments", value: university?.departments.length ?? 0, hint: "Listed on your page" },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="flex flex-col gap-4">
            <PanelTitle
              icon={School}
              title={university?.incubationCellName ?? "Your startup cell"}
              right={programmes.length > 0 && <PanelLink href="/onboarding/university">Edit programmes</PanelLink>}
            />
            {programmes.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {programmes.map((programme) => (
                  <li key={programme} className="flex items-start gap-3 rounded-button border border-border p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-button bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                      <Lightbulb className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="body-5 pt-1.5 text-text-primary">{programme}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-start gap-3 rounded-button border border-dashed border-border p-5">
                <div>
                  <p className="body-5 text-text-primary">No programmes listed</p>
                  <p className="caption-5">Add what students can join, and it shows on your campus page.</p>
                </div>
                <Button size="sm" variant="secondary" asChild>
                  <Link href="/onboarding/university">Add a programme</Link>
                </Button>
              </div>
            )}
            {university && university.departments.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <p className="caption-4">Departments</p>
                <div className="flex flex-wrap gap-2">
                  {university.departments.map((department) => (
                    <Badge key={department} variant="neutral">
                      {department}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="flex flex-col gap-4">
            <PanelTitle icon={GraduationCap} title="Support your student founders" />
            <ul className="grid gap-3 sm:grid-cols-2">
              {SUPPORT_FOUNDERS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group flex h-full items-start gap-3 rounded-button border border-border p-4 transition-colors duration-300 ease-base hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-white/5"
                  >
                    <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700 dark:text-brand-300" aria-hidden="true" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="body-5 text-text-primary">{item.label}</span>
                      <span className="caption-5">{item.hint}</span>
                    </span>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <CommunityPreview emptyHint="Share an E-cell event or a programme for student founders." />
        </div>

        <div className="flex flex-col gap-6">
          <ProfileStrengthCard />
          {university && <UniversityProfilePreview university={university} />}
          <OpenCallsCard emptyHint="No incubator is taking applications right now. Open calls show here as soon as one opens." />
          <VerificationChecklist />
        </div>
      </div>
    </div>
  );
}
