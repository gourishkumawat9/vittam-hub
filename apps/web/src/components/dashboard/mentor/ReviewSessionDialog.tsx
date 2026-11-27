"use client";

import { useReviewMentor, useReviewMentorBooking, type MentorBookingWithRelations } from "@vittamhub/api-client";
import { Button, Dialog, Textarea } from "@vittamhub/ui";
import { Star } from "@vittamhub/ui/icons";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const RATING_WORDS = ["", "Not helpful", "Somewhat helpful", "Helpful", "Very helpful", "Exceptional"];

/**
 * A short review after a session that happened. A founder rates the mentor
 * (it counts toward the mentor's average on their profile); a mentor rates the
 * founder (private, never shown on the founder's profile).
 */
export function ReviewSessionDialog({
  bookingId,
  reviewing,
  name,
  open,
  onOpenChange,
}: {
  bookingId: string;
  /** Who is being reviewed. */
  reviewing: "mentor" | "founder";
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const reviewMentor = useReviewMentor();
  const reviewFounder = useReviewMentorBooking();
  const mutation = reviewing === "mentor" ? reviewMentor : reviewFounder;

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setRating(0);
    setHovered(0);
    setComment("");
    setSubmitted(false);
    setError(null);
  }, [open]);

  const submit = async () => {
    if (rating === 0) return;
    setError(null);
    try {
      const input = { rating, comment: comment.trim() || undefined };
      await mutation.mutateAsync({ id: bookingId, input });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send that review. Try again in a moment.");
    }
  };

  const shown = hovered || rating;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`How was your session with ${name}?`}
      description={
        reviewing === "mentor"
          ? "Your rating counts toward their average on their mentor profile, and helps other founders choose."
          : "Private: it is never shown on their profile. It helps keep the mentor community honest."
      }
      footer={
        submitted ? (
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Not now
            </Button>
            <Button onClick={submit} isLoading={mutation.isPending} disabled={rating === 0}>
              Send review
            </Button>
          </>
        )
      }
    >
      {submitted ? (
        <p className="body-6 text-text-secondary">Thank you. Your review has been sent.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div role="radiogroup" aria-label="Rating" className="flex gap-1" onMouseLeave={() => setHovered(0)}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} star${value === 1 ? "" : "s"}, ${RATING_WORDS[value]}`}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHovered(value)}
                  className="rounded-md p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <Star className={cn("h-7 w-7 transition-colors", value <= shown ? "fill-warning-500 text-warning-500" : "text-border")} />
                </button>
              ))}
            </div>
            <p className="caption-4 h-4">{RATING_WORDS[shown]}</p>
          </div>
          <Textarea
            label="What helped most? (optional)"
            rows={3}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={reviewing === "mentor" ? "They helped us price our annual plan." : "Came prepared, with clear questions."}
          />
          {error && (
            <p role="alert" className="caption-2 text-danger-600">
              {error}
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}

/** Holds which session's review dialog is open, for a page that lists sessions. */
export function useSessionReview(viewer: "mentor" | "founder") {
  const [booking, setBooking] = useState<MentorBookingWithRelations | null>(null);
  const dialog = booking ? (
    <ReviewSessionDialog
      key={booking.id}
      bookingId={booking.id}
      reviewing={viewer === "mentor" ? "founder" : "mentor"}
      name={viewer === "mentor" ? booking.founder.fullName : booking.mentor.fullName}
      open
      onOpenChange={(open) => !open && setBooking(null)}
    />
  ) : null;
  return { openReview: setBooking, reviewDialog: dialog };
}
