"use client";

import { useScheduleMentorSession, type MentorBookingWithRelations } from "@vittamhub/api-client";
import { MENTOR_SESSION_DURATIONS, scheduleMentorSessionInputSchema } from "@vittamhub/types";
import { Button, Dialog, Input, Textarea, useToast } from "@vittamhub/ui";
import { CalendarClock } from "lucide-react";
import { useEffect, useState } from "react";

import { ChoiceChips } from "@/components/onboarding/fields";
import { isoToLocalInput, localInputToIso, nowForLocalInput } from "@/lib/datetime";

type Duration = `${(typeof MENTOR_SESSION_DURATIONS)[number]}`;
const DURATION_OPTIONS = MENTOR_SESSION_DURATIONS.map((minutes) => ({ value: String(minutes) as Duration, label: `${minutes} min` }));

/**
 * The mentor sets when an accepted session happens and where. Opens on the
 * founder's own preferred times, so the mentor can pick from them, and on the
 * current time and link when moving a session.
 */
export function ScheduleSessionDialog({
  booking,
  open,
  onOpenChange,
}: {
  booking: MentorBookingWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const schedule = useScheduleMentorSession();
  const { toast } = useToast();
  const moving = booking.scheduledAt !== null;

  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState<Duration>("45");
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Each time it opens, start from what the session holds now.
  useEffect(() => {
    if (!open) return;
    setWhen(isoToLocalInput(booking.scheduledAt));
    setDuration(String(booking.durationMinutes ?? 45) as Duration);
    setLink(booking.meetingUrl ?? "");
    setNote(booking.mentorNote ?? "");
    setErrors({});
    setSubmitError(null);
  }, [open, booking]);

  const save = async () => {
    setSubmitError(null);
    const parsed = scheduleMentorSessionInputSchema.safeParse({
      scheduledAt: localInputToIso(when) ?? "",
      durationMinutes: Number(duration),
      meetingUrl: link,
      note,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    try {
      await schedule.mutateAsync({ id: booking.id, input: parsed.data });
      toast({
        variant: "success",
        title: moving ? "Session moved" : "Session time set",
        description: `${booking.founder.fullName} has been told, and sees the time and link in their sessions.`,
      });
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "That didn't save. Try again in a moment.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={moving ? "Change the session time" : "Set the session time"}
      description={`With ${booking.founder.fullName}${booking.startup ? ` of ${booking.startup.name}` : ""}.`}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} isLoading={schedule.isPending}>
            {moving ? "Save new time" : "Set time"}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        {booking.preferredTimes && (
          <p className="flex items-start gap-2 rounded-button bg-background-secondary px-3 py-2">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
            <span className="caption-2 text-text-primary">
              <span className="font-semibold">They suggested:</span> {booking.preferredTimes}
            </span>
          </p>
        )}

        <Input
          label="Date and time"
          type="datetime-local"
          required
          min={nowForLocalInput()}
          value={when}
          onChange={(event) => setWhen(event.target.value)}
          hint="In your own time zone. The founder sees it in theirs."
          error={errors.scheduledAt}
        />

        <ChoiceChips label="Length" options={DURATION_OPTIONS} value={duration} onChange={setDuration} error={errors.durationMinutes} />

        <Input
          label="Meeting link"
          type="url"
          inputMode="url"
          placeholder="https://meet.google.com/…"
          value={link}
          onChange={(event) => setLink(event.target.value)}
          hint="A Google Meet, Zoom or Teams link. Leave it empty for a phone call."
          error={errors.meetingUrl}
        />

        <Textarea
          label="Note for the founder (optional)"
          rows={2}
          placeholder="Bring last month's numbers and your current pricing page."
          value={note}
          onChange={(event) => setNote(event.target.value)}
          error={errors.note}
        />

        {submitError && (
          <p role="alert" className="caption-2 text-danger-600">
            {submitError}
          </p>
        )}
      </form>
    </Dialog>
  );
}
