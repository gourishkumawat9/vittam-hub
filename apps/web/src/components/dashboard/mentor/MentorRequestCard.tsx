"use client";

import { useRespondToMentorBooking, type MentorBookingWithRelations } from "@vittamhub/api-client";
import { Avatar, Badge, Button, Card, useToast } from "@vittamhub/ui";
import { CalendarClock } from "@vittamhub/ui/icons";
import { formatRelativeTime } from "@vittamhub/utils";
import Link from "next/link";
import { useState } from "react";

import { STAGE_LABEL } from "../founder/startup-labels";

import { SESSION_TYPE_LABEL } from "./labels";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * One founder asking for a session: who, which startup and stage, what they
 * want to talk about and when. How long it has waited is shown up front, so a
 * request never quietly goes stale (MAARG withdraws them silently after 15
 * working days; we'd rather the mentor sees it).
 */
export function MentorRequestCard({ booking }: { booking: MentorBookingWithRelations }) {
  const respond = useRespondToMentorBooking();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"ACCEPT" | "DECLINE" | null>(null);
  const waitingDays = Math.floor((Date.now() - new Date(booking.createdAt).getTime()) / DAY_MS);

  const answer = async (action: "ACCEPT" | "DECLINE") => {
    setError(null);
    setPending(action);
    try {
      await respond.mutateAsync({ id: booking.id, input: { action } });
      toast(
        action === "ACCEPT"
          ? { variant: "success", title: `Accepted ${booking.founder.fullName}`, description: "Next, set a time and share a meeting link. It's under your upcoming sessions." }
          : { variant: "info", title: `Declined ${booking.founder.fullName}`, description: "They've been told, kindly and without a reason." },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't go through. Try again in a moment.");
    } finally {
      setPending(null);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={booking.founder.fullName} src={booking.founder.avatarUrl} size="md" />
          <div className="min-w-0">
            <p className="title-3 truncate">{booking.founder.fullName}</p>
            {booking.startup ? (
              <p className="caption-5 truncate">
                <Link href={`/startups/${booking.startup.slug}`} className="font-medium text-text-primary hover:underline">
                  {booking.startup.name}
                </Link>
                {" · "}
                {STAGE_LABEL[booking.startup.stage] ?? booking.startup.stage}
              </p>
            ) : (
              <p className="caption-5">No startup profile yet</p>
            )}
          </div>
        </div>
        <Badge variant={waitingDays >= 3 ? "warning" : "neutral"} className="shrink-0 whitespace-nowrap">
          {waitingDays === 0 ? "New today" : `Waiting ${waitingDays} day${waitingDays === 1 ? "" : "s"}`}
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        {booking.sessionType && <span className="caption-3">{SESSION_TYPE_LABEL[booking.sessionType] ?? booking.sessionType}</span>}
        <p className="body-6 line-clamp-4 text-text-primary">{booking.message}</p>
        {booking.startup?.tagline && <p className="caption-5 line-clamp-1">{booking.startup.tagline}</p>}
      </div>

      {booking.preferredTimes && (
        <p className="flex items-start gap-2 rounded-button bg-background-secondary px-3 py-2">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
          <span className="caption-2 text-text-primary">{booking.preferredTimes}</span>
        </p>
      )}

      {error && (
        <p role="alert" className="caption-2 text-danger-600">
          {error}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="caption-5">Requested {formatRelativeTime(booking.createdAt)}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => answer("DECLINE")} isLoading={pending === "DECLINE"} disabled={pending !== null}>
            Decline
          </Button>
          <Button size="sm" onClick={() => answer("ACCEPT")} isLoading={pending === "ACCEPT"} disabled={pending !== null}>
            Accept
          </Button>
        </div>
      </div>
    </Card>
  );
}
