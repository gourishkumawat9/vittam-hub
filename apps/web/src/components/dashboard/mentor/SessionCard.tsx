"use client";

import { useCompleteMentorSession, type MentorBookingWithRelations } from "@vittamhub/api-client";
import { Avatar, Badge, Button, Card, useToast } from "@vittamhub/ui";
import { CalendarClock, CalendarPlus, CheckCircle2, MessageSquareText, Star, Video } from "@vittamhub/ui/icons";
import { formatRelativeTime } from "@vittamhub/utils";
import Link from "next/link";
import { useState } from "react";

import { externalHref } from "@/lib/safe-url";

import { STAGE_LABEL } from "../founder/startup-labels";

import { ScheduleSessionDialog } from "./ScheduleSessionDialog";
import { SESSION_TYPE_LABEL } from "./labels";
import { downloadCalendarFile, formatSessionTime, sessionPhase, timeUntil, type SessionPhase } from "./sessions";

const PHASE_BADGE: Record<SessionPhase, { label: string; variant: "neutral" | "brand" | "success" | "warning" | "danger" }> = {
  request: { label: "Waiting for reply", variant: "neutral" },
  declined: { label: "Declined", variant: "neutral" },
  "needs-time": { label: "Needs a time", variant: "warning" },
  upcoming: { label: "Upcoming", variant: "brand" },
  "wrap-up": { label: "Did it happen?", variant: "warning" },
  done: { label: "Done", variant: "success" },
};

/**
 * One accepted session, for either side. It says what happens next and puts
 * that one action first: set a time, join the call, mark it done, or review.
 *
 * Marking a session done moves it to another list, which unmounts this card,
 * so the review dialog belongs to the page: `onReview` asks it to open.
 */
export function SessionCard({
  booking,
  viewer,
  onReview,
}: {
  booking: MentorBookingWithRelations;
  viewer: "mentor" | "founder";
  onReview: (booking: MentorBookingWithRelations) => void;
}) {
  const complete = useCompleteMentorSession();
  const { toast } = useToast();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phase = sessionPhase(booking);
  const isMentor = viewer === "mentor";
  const other = isMentor ? booking.founder : booking.mentor;
  const joinHref = externalHref(booking.meetingUrl);
  const badge = PHASE_BADGE[phase];

  const markDone = async () => {
    setError(null);
    try {
      await complete.mutateAsync(booking.id);
      toast({ variant: "success", title: "Session marked done", description: `It now counts toward ${isMentor ? "your" : "their"} sessions completed.` });
      onReview(booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't go through. Try again in a moment.");
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={other.fullName} src={other.avatarUrl} size="md" />
          <div className="min-w-0">
            <p className="title-3 truncate">{other.fullName}</p>
            {isMentor ? (
              booking.startup ? (
                <p className="caption-5 truncate">
                  <Link href={`/startups/${booking.startup.slug}`} className="font-medium text-text-primary hover:underline">
                    {booking.startup.name}
                  </Link>
                  {" · "}
                  {STAGE_LABEL[booking.startup.stage] ?? booking.startup.stage}
                </p>
              ) : (
                <p className="caption-5">No startup profile yet</p>
              )
            ) : (
              <p className="caption-5 truncate">{booking.sessionType ? (SESSION_TYPE_LABEL[booking.sessionType] ?? "Mentor") : "Mentor"}</p>
            )}
          </div>
        </div>
        <Badge variant={badge.variant} className="shrink-0 whitespace-nowrap">
          {badge.label}
        </Badge>
      </div>

      {/* When, and where. */}
      {booking.scheduledAt ? (
        <div className="flex flex-col gap-1 rounded-button bg-background-secondary px-3 py-2.5">
          <p className="flex items-center gap-2 body-5 text-text-primary">
            <CalendarClock className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
            {formatSessionTime(booking.scheduledAt, booking.durationMinutes)}
          </p>
          <p className="caption-5 pl-6">
            {phase === "upcoming"
              ? `${timeUntil(booking.scheduledAt)}${joinHref ? " · video call" : " · no link, so likely a phone call"}`
              : phase === "done"
                ? `Marked done ${formatRelativeTime(booking.completedAt!)}`
                : "This time has passed"}
          </p>
        </div>
      ) : phase === "needs-time" ? (
        <div className="flex flex-col gap-1 rounded-button border border-dashed border-border px-3 py-2.5">
          <p className="body-5 text-text-primary">{isMentor ? "Pick a time that works for you" : `Waiting for ${booking.mentor.fullName} to set a time`}</p>
          {booking.preferredTimes && (
            <p className="caption-5">
              {isMentor ? "They suggested" : "You suggested"}: {booking.preferredTimes}
            </p>
          )}
        </div>
      ) : phase === "done" && booking.completedAt ? (
        <p className="caption-5">Marked done {formatRelativeTime(booking.completedAt)}</p>
      ) : null}

      {booking.mentorNote && phase !== "done" && (
        <p className="flex items-start gap-2 caption-2 text-text-primary">
          <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
          <span>
            <span className="font-semibold">{isMentor ? "Your note" : `Note from ${booking.mentor.fullName}`}:</span> {booking.mentorNote}
          </span>
        </p>
      )}

      <p className="caption-5 line-clamp-2">
        <span className="font-medium text-text-secondary">Topic:</span> {booking.message}
      </p>

      {error && (
        <p role="alert" className="caption-2 text-danger-600">
          {error}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        {phase === "needs-time" && (
          <>
            <Button size="sm" variant="ghost" onClick={markDone} isLoading={complete.isPending}>
              We already met
            </Button>
            {isMentor && (
              <Button size="sm" onClick={() => setScheduleOpen(true)}>
                Set a time
              </Button>
            )}
          </>
        )}

        {phase === "upcoming" && (
          <>
            {isMentor && (
              <Button size="sm" variant="ghost" onClick={() => setScheduleOpen(true)}>
                Change time
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => downloadCalendarFile(booking, other.fullName)}>
              <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
              Add to calendar
            </Button>
            {joinHref && (
              <Button size="sm" asChild>
                <a href={joinHref} target="_blank" rel="noopener noreferrer">
                  <Video className="h-3.5 w-3.5" aria-hidden="true" />
                  Join call
                </a>
              </Button>
            )}
          </>
        )}

        {phase === "wrap-up" && (
          <>
            {isMentor && (
              <Button size="sm" variant="ghost" onClick={() => setScheduleOpen(true)}>
                It moved, set a new time
              </Button>
            )}
            <Button size="sm" onClick={markDone} isLoading={complete.isPending}>
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Mark as done
            </Button>
          </>
        )}

        {phase === "done" &&
          (booking.reviewedByMe ? (
            <span className="flex items-center gap-1.5 caption-4">
              <Star className="h-3.5 w-3.5 fill-warning-500 text-warning-500" aria-hidden="true" />
              You reviewed this session
            </span>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => onReview(booking)}>
              <Star className="h-3.5 w-3.5" aria-hidden="true" />
              Review {isMentor ? "founder" : "mentor"}
            </Button>
          ))}
      </div>

      {isMentor && <ScheduleSessionDialog booking={booking} open={scheduleOpen} onOpenChange={setScheduleOpen} />}
    </Card>
  );
}
