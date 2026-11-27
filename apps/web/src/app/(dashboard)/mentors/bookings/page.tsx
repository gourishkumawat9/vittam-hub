"use client";

import { useCurrentUser, useMentorBookings, useMyMentorProfile, type MentorBookingWithRelations } from "@vittamhub/api-client";
import { Avatar, Badge, Button, Card, EmptyState, Tabs } from "@vittamhub/ui";
import { CalendarClock, History, Inbox } from "@vittamhub/ui/icons";
import { formatRelativeTime } from "@vittamhub/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { MentorRequestCard } from "@/components/dashboard/mentor/MentorRequestCard";
import { useSessionReview } from "@/components/dashboard/mentor/ReviewSessionDialog";
import { SessionCard } from "@/components/dashboard/mentor/SessionCard";
import { SESSION_TYPE_LABEL } from "@/components/dashboard/mentor/labels";
import { activeSessions, sessionPhase } from "@/components/dashboard/mentor/sessions";

/** A request the founder sent that the mentor hasn't answered yet. */
function SentRequestCard({ booking }: { booking: MentorBookingWithRelations }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={booking.mentor.fullName} src={booking.mentor.avatarUrl} size="md" />
          <div className="min-w-0">
            <p className="title-3 truncate">{booking.mentor.fullName}</p>
            <p className="caption-5">{booking.sessionType ? (SESSION_TYPE_LABEL[booking.sessionType] ?? "Mentor") : "Mentor"}</p>
          </div>
        </div>
        <Badge variant="neutral" className="shrink-0 whitespace-nowrap">
          Waiting for reply
        </Badge>
      </div>
      <p className="body-6 line-clamp-3 text-text-primary">{booking.message}</p>
      {booking.preferredTimes && <p className="caption-5">You suggested: {booking.preferredTimes}</p>}
      <p className="mt-auto caption-5">Sent {formatRelativeTime(booking.createdAt)}. You&apos;ll get a notification when they reply.</p>
    </Card>
  );
}

/** A declined request, kept as a short line so the list stays honest without taking space. */
function DeclinedRow({ booking, viewer }: { booking: MentorBookingWithRelations; viewer: "mentor" | "founder" }) {
  const other = viewer === "mentor" ? booking.founder : booking.mentor;
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={other.fullName} src={other.avatarUrl} size="sm" />
        <div className="min-w-0">
          <p className="body-5 truncate text-text-primary">{other.fullName}</p>
          <p className="caption-5 truncate">{booking.message}</p>
        </div>
      </div>
      <span className="caption-5 shrink-0">Declined {formatRelativeTime(booking.respondedAt ?? booking.createdAt)}</span>
    </li>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">{children}</div>;
}

/**
 * Every mentor session in one place, for both sides of it. A mentor sees
 * requests to answer, sessions to set up or wrap up, and past sessions; a
 * founder sees the requests they sent and the same sessions from their side.
 */
export default function MentorSessionsPage() {
  const { data: user } = useCurrentUser();
  const { data: bookings, isLoading } = useMentorBookings();
  const viewer: "mentor" | "founder" = user?.role === "MENTOR" ? "mentor" : "founder";
  const isMentor = viewer === "mentor";
  const { data: mentorProfile } = useMyMentorProfile(isMentor);
  const { openReview, reviewDialog } = useSessionReview(viewer);

  const groups = useMemo(() => {
    // A mentor only answers requests sent to them; a founder only tracks the ones they sent.
    const mine = (bookings ?? []).filter((booking) => (isMentor ? booking.mentor.id === user?.id : booking.founder.id === user?.id));
    const requests = mine.filter((b) => b.status === "PENDING").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const active = activeSessions(mine);
    const past = mine
      .filter((b) => sessionPhase(b) === "done")
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
    const declined = mine.filter((b) => b.status === "DECLINED");
    return { requests, active, past, declined };
  }, [bookings, isMentor, user?.id]);

  const [tab, setTab] = useState<string | null>(null);
  // Open on whatever needs attention first.
  const defaultTab = isMentor && groups.requests.length > 0 ? "requests" : groups.active.length > 0 ? "upcoming" : groups.requests.length > 0 ? "requests" : "past";
  const needsTime = groups.active.filter((b) => sessionPhase(b) === "needs-time").length;
  const toWrapUp = groups.active.filter((b) => sessionPhase(b) === "wrap-up").length;

  const description = isMentor
    ? groups.requests.length > 0
      ? `${groups.requests.length} request${groups.requests.length === 1 ? "" : "s"} waiting for your reply.`
      : needsTime > 0
        ? `${needsTime} accepted session${needsTime === 1 ? " needs" : "s need"} a time.`
        : "Requests from founders, the sessions you have set up, and the ones you have done."
    : "The sessions you asked mentors for, and where each one stands.";

  const label = (text: string, count: number) => (count > 0 ? `${text} (${count})` : text);

  const items = [
    {
      value: "requests",
      label: label(isMentor ? "Requests" : "Waiting for reply", groups.requests.length),
      content:
        groups.requests.length > 0 ? (
          <CardGrid>
            {groups.requests.map((booking) =>
              isMentor ? <MentorRequestCard key={booking.id} booking={booking} /> : <SentRequestCard key={booking.id} booking={booking} />,
            )}
          </CardGrid>
        ) : (
          <EmptyState
            icon={Inbox}
            title={isMentor ? "No requests waiting" : "Nothing waiting for a reply"}
            description={
              isMentor
                ? "New requests from founders show up here, with what they want to talk about and when they're free."
                : "Requests you send to mentors wait here until they reply."
            }
            action={
              !isMentor && (
                <Button size="sm" asChild>
                  <Link href="/mentors">Find a mentor</Link>
                </Button>
              )
            }
          />
        ),
    },
    {
      value: "upcoming",
      label: label("Upcoming", groups.active.length),
      content:
        groups.active.length > 0 ? (
          <div className="flex flex-col gap-4">
            {toWrapUp > 0 && (
              <p className="caption-2">
                {toWrapUp === 1
                  ? "One session's time has passed. Mark it done so it counts, then leave a short review."
                  : `${toWrapUp} sessions' times have passed. Mark them done so they count, then leave a short review.`}
              </p>
            )}
            <CardGrid>
              {groups.active.map((booking) => (
                <SessionCard key={booking.id} booking={booking} viewer={viewer} onReview={openReview} />
              ))}
            </CardGrid>
          </div>
        ) : (
          <EmptyState
            icon={CalendarClock}
            title="No upcoming sessions"
            description={
              isMentor
                ? "When you accept a request, the session appears here so you can set a time and share a meeting link."
                : "When a mentor accepts, the session appears here with its time and a link to join."
            }
          />
        ),
    },
    {
      value: "past",
      label: label("Past", groups.past.length),
      content:
        groups.past.length > 0 ? (
          <CardGrid>
            {groups.past.map((booking) => (
              <SessionCard key={booking.id} booking={booking} viewer={viewer} onReview={openReview} />
            ))}
          </CardGrid>
        ) : (
          <EmptyState icon={History} title="No past sessions yet" description="Sessions marked done are kept here, with your review." />
        ),
    },
    ...(groups.declined.length > 0
      ? [
          {
            value: "declined",
            label: label("Declined", groups.declined.length),
            content: (
              <Card>
                <ul className="flex flex-col divide-y divide-border">
                  {groups.declined.map((booking) => (
                    <DeclinedRow key={booking.id} booking={booking} viewer={viewer} />
                  ))}
                </ul>
              </Card>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={isMentor ? "Sessions" : "Mentor sessions"}
        description={description}
        actions={
          isMentor ? (
            mentorProfile && (
              <Button size="sm" variant="secondary" asChild>
                <Link href={`/mentors/${mentorProfile.id}`}>View public profile</Link>
              </Button>
            )
          ) : (
            <Button size="sm" asChild>
              <Link href="/mentors">Find a mentor</Link>
            </Button>
          )
        }
      />

      {isLoading || !user ? <ListRowsSkeleton /> : <Tabs items={items} value={tab ?? defaultTab} onValueChange={setTab} />}

      {reviewDialog}
    </div>
  );
}
