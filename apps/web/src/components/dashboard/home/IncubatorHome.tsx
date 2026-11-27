"use client";

import { useFollowers, useMyIncubatorProfile, useMyVerification } from "@vittamhub/api-client";
import { Badge, Button, Card, Skeleton } from "@vittamhub/ui";
import { ArrowRight, CalendarDays, GraduationCap, Layers, Megaphone } from "@vittamhub/ui/icons";
import Link from "next/link";

import { VerifiedBadge } from "@/components/VerifiedBadge";

import { PageHeader, PanelLink, PanelTitle } from "../PageHeader";
import { ProfileStrengthCard } from "../ProfileStrengthCard";
import { type Stat, StatStrip } from "../StatStrip";
import { VerificationChecklist } from "../VerificationChecklist";
import { IncubatorProfilePreview } from "../incubator/IncubatorProfilePreview";
import { ProgrammeList } from "../incubator/ProgrammeList";
import { KIND_LABEL, openCallCount } from "../incubator/programmes";

import { CommunityPreview } from "./CommunityPreview";
import { StartHere } from "./StartHere";

/** Ways to put the programme in front of founders, each a link to where it's done. */
const REACH_FOUNDERS = [
  {
    href: "/community?compose=post",
    icon: Megaphone,
    label: "Announce an open call",
    hint: "A post on the community feed, with who should apply and by when",
  },
  {
    href: "/community?compose=event",
    icon: CalendarDays,
    label: "Post your demo day or an info session",
    hint: "Events show under Upcoming events on the community page",
  },
  {
    href: "/mentors",
    icon: GraduationCap,
    label: "Find mentors for your founders",
    hint: "Mentors on VittamHub take session requests from founders",
  },
];

/**
 * The incubator's home, built around its programmes: which ones are taking
 * applications, how the page looks to founders and what's missing from it,
 * and the ways to get an open call seen.
 */
export function IncubatorHome() {
  const { data: incubator, isLoading } = useMyIncubatorProfile();
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

  const programmes = incubator?.programs ?? [];
  const openCalls = openCallCount(programmes);

  // Every published profile is listed from the start; verified ones are shown first (CLAUDE.md §7a).
  const listing: Stat = verificationLoading
    ? { label: "Directory listing", value: "…" }
    : !incubator
      ? { label: "Directory listing", value: "Not published", hint: "Finish your profile to appear", href: "/onboarding/incubator" }
      : incubator.verificationStatus === "VERIFIED" || verification?.status === "VERIFIED"
        ? { label: "Directory listing", value: "Verified", hint: "Shown first in the incubator directory" }
        : { label: "Directory listing", value: "Listed", hint: "Verified profiles are shown first", href: "/settings#verification" };

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title={incubator?.organizationName ?? "Incubator home"}
        meta={
          incubator && (
            <>
              <Badge variant="neutral">{KIND_LABEL[incubator.kind] ?? "Incubator"}</Badge>
              <VerifiedBadge status={incubator.verificationStatus} />
            </>
          )
        }
        description={
          !incubator
            ? "Publish your incubator profile and founders can find your programmes in the directory."
            : openCalls > 0
              ? `${openCalls === 1 ? "1 programme is" : `${openCalls} programmes are`} taking applications. Founders apply from your page.`
              : "Your programme page on VittamHub. Founders find it in the incubator directory."
        }
        actions={
          <>
            {incubator && (
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/incubators/${incubator.id}`}>View public page</Link>
              </Button>
            )}
            <Button size="sm" asChild>
              <Link href={incubator ? "/community?compose=post" : "/onboarding/incubator"}>
                {incubator ? "Announce an open call" : "Finish your profile"}
              </Link>
            </Button>
          </>
        }
      />

      {!incubator && (
        <StartHere
          steps={[
            {
              title: "Publish your incubator profile",
              hint: "Who you are, the industries you back and the startups you've worked with.",
              href: "/onboarding/incubator",
              cta: "Finish profile",
              done: false,
            },
            {
              title: "Add a programme with dates",
              hint: "Founders look for an open call, how long it runs and who can apply.",
              href: "/onboarding/incubator",
              cta: "Add a programme",
              done: false,
            },
            {
              title: "Announce it to the community",
              hint: "A short post tells founders the call is open.",
              href: "/community?compose=post",
              cta: "Write a post",
              done: false,
            },
          ]}
        />
      )}

      <StatStrip
        stats={[
          {
            label: "Programmes",
            value: programmes.length,
            hint: openCalls > 0 ? `${openCalls} taking applications` : "None taking applications now",
          },
          listing,
          { label: "Followers", value: followers?.length ?? "…", hint: "Members who see your posts" },
          {
            label: "Startups backed",
            value: incubator?.portfolioCompanies.length ?? 0,
            hint: "Listed on your page",
          },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="flex flex-col gap-4">
            <PanelTitle
              icon={Layers}
              title="Your programmes"
              right={programmes.length > 0 && <PanelLink href="/onboarding/incubator">Edit programmes</PanelLink>}
            />
            {programmes.length > 0 ? (
              <ProgrammeList programmes={programmes} viewer="owner" />
            ) : (
              <div className="flex flex-col items-start gap-3 rounded-button border border-dashed border-border p-5">
                <div>
                  <p className="body-5 text-text-primary">No programmes listed</p>
                  <p className="caption-5">Add one with its dates and who can apply, and founders see it on your page.</p>
                </div>
                <Button size="sm" variant="secondary" asChild>
                  <Link href="/onboarding/incubator">Add a programme</Link>
                </Button>
              </div>
            )}
          </Card>

          <Card className="flex flex-col gap-4">
            <PanelTitle icon={Megaphone} title="Reach founders" />
            <ul className="flex flex-col divide-y divide-border">
              {REACH_FOUNDERS.map((item) => (
                <li key={item.label} className="py-3 first:pt-0 last:pb-0">
                  <Link href={item.href} className="group flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-button bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="body-5 text-text-primary group-hover:text-brand-primary">{item.label}</span>
                      <span className="caption-5">{item.hint}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <CommunityPreview emptyHint="Announce an open call or a demo day so founders hear about it." />
        </div>

        <div className="flex flex-col gap-6">
          <ProfileStrengthCard />
          {incubator && <IncubatorProfilePreview incubator={incubator} />}
          <VerificationChecklist />
        </div>
      </div>
    </div>
  );
}
