"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCurrentUser,
  useMentorBookings,
  useRespondToMentorBooking,
  useReviewMentorBooking,
  type MentorBookingWithRelations,
} from "@vittamhub/api-client";
import { createFounderReviewInputSchema, type CreateFounderReviewInput } from "@vittamhub/types";
import { Badge, Button, Dialog, EmptyState, Textarea } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import { CalendarClock, Star } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";

const STATUS_BADGE_VARIANT: Record<string, "success" | "warning" | "danger"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  DECLINED: "danger",
};

function LeaveReviewDialog({ bookingId, open, onOpenChange }: { bookingId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const submitReview = useReviewMentorBooking();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
  } = useForm<CreateFounderReviewInput>({ resolver: zodResolver(createFounderReviewInputSchema), defaultValues: { rating: 0 } });

  const rating = watch("rating");

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      await submitReview.mutateAsync({ id: bookingId, input: data });
      setSubmitted(true);
      reset();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Couldn't submit that review.");
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setSubmitted(false);
      }}
      title="Review the founder"
      description="Feeds their Founder Reputation score — never shown publicly."
      footer={
        !submitted && (
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} isLoading={submitReview.isPending} disabled={rating === 0}>
              Submit review
            </Button>
          </>
        )
      }
    >
      {submitted ? (
        <p className="text-sm text-text-secondary">Thanks — your review has been submitted.</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" onClick={() => setValue("rating", value)} aria-label={`${value} stars`}>
                <Star className={`h-6 w-6 ${value <= rating ? "fill-warning-500 text-warning-500" : "text-border"}`} />
              </button>
            ))}
          </div>
          <Textarea label="Comment (optional)" rows={3} {...register("comment")} />
          {submitError && <p className="text-sm text-danger-600">{submitError}</p>}
        </form>
      )}
    </Dialog>
  );
}

function BookingRow({ booking, isMentorView }: { booking: MentorBookingWithRelations; isMentorView: boolean }) {
  const respond = useRespondToMentorBooking();
  const [actioning, setActioning] = useState<"ACCEPT" | "DECLINE" | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const act = async (action: "ACCEPT" | "DECLINE") => {
    setActioning(action);
    try {
      await respond.mutateAsync({ id: booking.id, input: { action } });
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-primary">
            {isMentorView ? booking.founder.fullName : booking.mentor.fullName}
          </p>
          <p className="text-xs text-text-secondary">
            {booking.startup?.name ? `${booking.startup.name} · ` : ""}
            {formatRelativeTime(booking.createdAt)}
          </p>
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[booking.status] ?? "warning"}>{booking.status}</Badge>
      </div>
      <p className="text-sm text-text-secondary">{booking.message}</p>
      {booking.preferredTimes && <p className="text-xs text-text-secondary">Preferred times: {booking.preferredTimes}</p>}
      {isMentorView && booking.status === "PENDING" && (
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button size="sm" variant="secondary" isLoading={actioning === "DECLINE"} onClick={() => act("DECLINE")}>
            Decline
          </Button>
          <Button size="sm" isLoading={actioning === "ACCEPT"} onClick={() => act("ACCEPT")}>
            Accept
          </Button>
        </div>
      )}
      {isMentorView && booking.status === "ACCEPTED" && (
        <div className="flex justify-end border-t border-border pt-3">
          <Button size="sm" variant="ghost" onClick={() => setReviewOpen(true)}>
            <Star className="h-3.5 w-3.5" /> Review founder
          </Button>
        </div>
      )}
      <LeaveReviewDialog bookingId={booking.id} open={reviewOpen} onOpenChange={setReviewOpen} />
    </div>
  );
}

export default function MentorBookingsPage() {
  const { data: user } = useCurrentUser();
  const { data: bookings, isLoading } = useMentorBookings();
  const isMentorView = user?.role === "MENTOR";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">Mentor session requests</h1>

      {isLoading ? (
        <ListRowsSkeleton />
      ) : bookings && bookings.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {bookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} isMentorView={isMentorView} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarClock}
          title="No session requests yet"
          description={isMentorView ? "Founder session requests will show up here." : "Requests you send to mentors will show up here."}
        />
      )}
    </div>
  );
}
