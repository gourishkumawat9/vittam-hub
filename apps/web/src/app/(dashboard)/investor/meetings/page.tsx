"use client";

import { useCurrentUser, useMyMeetings } from "@vittamhub/api-client";
import { Badge, Button, Card, EmptyState } from "@vittamhub/ui";
import { Calendar, MessageSquareText, Video } from "@vittamhub/ui/icons";
import { formatRelativeTime } from "@vittamhub/utils";
import Link from "next/link";
import { useMemo } from "react";

import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { externalHref } from "@/lib/safe-url";
import { cn } from "@/lib/utils";

type MeetingItem = NonNullable<ReturnType<typeof useMyMeetings>["data"]>[number];

/** A meeting as one row: a date block, who it's with, when, and how to join. */
function MeetingRow({ meeting, viewerName, past }: { meeting: MeetingItem; viewerName: string | undefined; past: boolean }) {
  const when = new Date(meeting.scheduledAt);
  const otherParty =
    meeting.connection.requester.fullName === viewerName ? meeting.connection.recipient.fullName : meeting.connection.requester.fullName;
  const joinHref = externalHref(meeting.videoCallUrl);

  return (
    <Card className={cn("flex flex-col gap-4 sm:flex-row sm:items-center", past && "opacity-80")}>
      <div
        className={cn(
          "flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-card",
          past ? "bg-background-secondary text-text-secondary" : "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200",
        )}
      >
        <span className="caption-4 uppercase">{when.toLocaleDateString(undefined, { month: "short" })}</span>
        <span className="font-numeric text-2xl font-bold leading-none">{when.getDate()}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="title-3 truncate">{meeting.connection.startup?.name ?? otherParty}</p>
          {!past && <Badge variant="brand">{formatRelativeTime(meeting.scheduledAt)}</Badge>}
        </div>
        <p className="caption-2">
          {when.toLocaleDateString(undefined, { weekday: "long" })} · {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          {meeting.connection.startup && ` · with ${otherParty}`}
        </p>
        {meeting.notes && <p className="caption-5 line-clamp-2">{meeting.notes}</p>}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" asChild>
          <Link href={`/connections/${meeting.connection.id}`}>
            <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" /> Conversation
          </Link>
        </Button>
        {!past && joinHref && (
          <Button size="sm" asChild>
            <a href={joinHref} target="_blank" rel="noopener noreferrer">
              <Video className="h-3.5 w-3.5" aria-hidden="true" /> Join call
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
}

/** Meetings with founders, coming up first, then the ones that have happened. */
export default function MeetingsPage() {
  const { data: meetings, isLoading } = useMyMeetings();
  const { data: user } = useCurrentUser();

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const all = meetings ?? [];
    return {
      upcoming: all.filter((m) => new Date(m.scheduledAt).getTime() >= now).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
      past: all.filter((m) => new Date(m.scheduledAt).getTime() < now).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)),
    };
  }, [meetings]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Meetings"
        description={
          upcoming.length > 0
            ? `${upcoming.length} coming up. Times show in your own time zone.`
            : "Meetings you and a founder set up after a connect request is accepted."
        }
        actions={
          <Button size="sm" variant="secondary" asChild>
            <Link href="/investor/requests">Connect requests</Link>
          </Button>
        }
      />

      {isLoading ? (
        <ListRowsSkeleton />
      ) : upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No meetings yet"
          description="Accept a connect request, then propose a time from the conversation. It shows here with a link to join."
          action={
            <Button size="sm" asChild>
              <Link href="/investor/requests">See connect requests</Link>
            </Button>
          }
        />
      ) : (
        <>
          <section className="flex flex-col gap-3" aria-labelledby="upcoming-heading">
            <h2 id="upcoming-heading" className="title-2">
              Coming up
            </h2>
            {upcoming.length > 0 ? (
              upcoming.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} viewerName={user?.fullName} past={false} />)
            ) : (
              <p className="caption-2">Nothing booked. Propose a time from any accepted conversation.</p>
            )}
          </section>

          {past.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="past-heading">
              <h2 id="past-heading" className="title-2">
                Past
              </h2>
              {past.map((meeting) => (
                <MeetingRow key={meeting.id} meeting={meeting} viewerName={user?.fullName} past />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
