"use client";

import { useCurrentUser, useMentorBookings, useMyMentorProfile, useMyVerification } from "@vittamhub/api-client";
import { Button, Skeleton } from "@vittamhub/ui";
import { Inbox } from "lucide-react";
import Link from "next/link";

import { PageHeader, SectionHeader } from "../PageHeader";
import { StatStrip } from "../StatStrip";
import { VerificationChecklist } from "../VerificationChecklist";
import { MentorProfilePreview } from "../mentor/MentorProfilePreview";
import { MentorRequestCard } from "../mentor/MentorRequestCard";
import { YourFoundersPanel } from "../mentor/YourFoundersPanel";

import { CommunityPreview } from "./CommunityPreview";
import { StartHere } from "./StartHere";

/**
 * The mentor's home, built around the founders they help rather than around
 * numbers: requests waiting for an answer first, then a few honest figures,
 * the founders they are working with, and how their profile looks to them.
 */
export function MentorHome({ firstName }: { firstName: string }) {
  const { data: user } = useCurrentUser();
  const { data: mentor, isLoading: mentorLoading } = useMyMentorProfile();
  const { data: bookings, isLoading: bookingsLoading } = useMentorBookings();
  const { data: verification } = useMyVerification();

  const received = (bookings ?? []).filter((booking) => booking.mentor.id === user?.id);
  const pending = received.filter((booking) => booking.status === "PENDING").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const accepted = received.filter((booking) => booking.status === "ACCEPTED");
  const foundersHelped = new Set(accepted.map((booking) => booking.founder.id)).size;
  const rating = mentor?.reputation.averageRating;

  const verificationDone =
    mentor?.verificationStatus === "VERIFIED" || (!!verification && verification.requirements.every((requirement) => requirement.met));
  const isNew = !bookingsLoading && received.length === 0;

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={
          pending.length > 0
            ? `${pending.length} founder${pending.length === 1 ? " is" : "s are"} waiting for your reply.`
            : "Founders can find you in the mentor directory and request a session."
        }
        actions={
          <>
            {mentor && (
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/mentors/${mentor.id}`}>View public profile</Link>
              </Button>
            )}
            <Button size="sm" asChild>
              <Link href="/mentors/bookings">All session requests</Link>
            </Button>
          </>
        }
      />

      {isNew && (
        <StartHere
          title="Start here"
          steps={[
            {
              title: "Finish your mentor profile",
              hint: "A headline, your expertise and when you are free. Founders choose on these.",
              href: "/onboarding/mentor",
              cta: mentor ? "Review profile" : "Finish profile",
              done: !!mentor,
            },
            {
              title: "Earn the Verified badge",
              hint: "Add the few details and documents the badge needs. It lifts you in the directory.",
              href: "/settings#verification",
              cta: "See what's needed",
              done: verificationDone,
            },
            {
              title: "Say hello to the community",
              hint: "A short post on what you can help with brings the first requests in.",
              href: "/community",
              cta: "Write a post",
              done: false,
            },
          ]}
        />
      )}

      <StatStrip
        stats={[
          {
            label: "Requests waiting",
            value: bookingsLoading ? "…" : pending.length,
            hint: pending.length > 0 ? "Oldest first below" : "You're all caught up",
            href: "/mentors/bookings",
          },
          { label: "Founders helped", value: bookingsLoading ? "…" : foundersHelped, hint: "Requests you accepted" },
          {
            label: "Sessions completed",
            value: mentorLoading ? "…" : (mentor?.reputation.sessionsCompleted ?? 0),
            hint: "Counted once both sides confirm",
          },
          {
            label: "Average rating",
            value: rating != null ? rating.toFixed(1) : "None yet",
            hint: mentor ? `${mentor.reputation.reviewCount} review${mentor.reputation.reviewCount === 1 ? "" : "s"} from founders` : undefined,
          },
        ]}
      />

      <section className="flex flex-col gap-4" aria-labelledby="requests-heading">
        <SectionHeader
          id="requests-heading"
          title="Needs your reply"
          description="Accept to start the conversation. Declining tells the founder kindly, with no reason needed."
          href={pending.length > 4 ? "/mentors/bookings" : undefined}
        />
        {bookingsLoading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        ) : pending.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {pending.slice(0, 4).map((booking) => (
              <MentorRequestCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-card border border-dashed border-border px-6 py-8">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button bg-background-secondary">
              <Inbox className="h-5 w-5 text-text-secondary" aria-hidden="true" />
            </span>
            <div>
              <p className="body-5 text-text-primary">No requests waiting</p>
              <p className="caption-5">New requests from founders show up here first, with what they want to talk about.</p>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <YourFoundersPanel accepted={accepted} />
          <CommunityPreview emptyHint="Mentors who share a short tip or an open office hour get found faster." />
        </div>
        <div className="flex flex-col gap-6">
          {mentorLoading ? <Skeleton className="h-72 w-full" /> : mentor ? <MentorProfilePreview mentor={mentor} /> : null}
          <VerificationChecklist />
        </div>
      </div>
    </div>
  );
}
