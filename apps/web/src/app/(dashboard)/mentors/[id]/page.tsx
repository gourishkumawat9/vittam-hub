"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useBookMentor, useMentor } from "@vittamhub/api-client";
import { createMentorBookingInputSchema, SessionType, type CreateMentorBookingInput } from "@vittamhub/types";
import { Avatar, Badge, Button, Card, Dialog, ErrorState, Select, Skeleton, Textarea, Input } from "@vittamhub/ui";
import { Briefcase, CalendarClock, CheckCircle2, Clock, Languages, MonitorSmartphone, Rocket, Star, Wallet } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { VerifiedBadge } from "@/components/VerifiedBadge";
import { FollowButton } from "@/components/dashboard/FollowButton";
import { PanelTitle } from "@/components/dashboard/PageHeader";
import { StatStrip } from "@/components/dashboard/StatStrip";
import { SESSION_TYPE_LABEL } from "@/components/dashboard/mentor/labels";
import { MEETING_MODE_LABEL, MENTOR_TYPE_LABEL } from "@/lib/signup-options";
import { STAGE_LABEL } from "@/lib/startup-options";

const SESSION_TYPE_OPTIONS = Object.values(SessionType).map((type) => ({
  label: type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
  value: type,
}));

function RequestSessionDialog({ mentorId, open, onOpenChange }: { mentorId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const bookMentor = useBookMentor();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateMentorBookingInput>({ resolver: zodResolver(createMentorBookingInputSchema) });

  const onSubmit = handleSubmit(async (data) => {
    await bookMentor.mutateAsync({ id: mentorId, input: data });
    setSent(true);
    reset();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setSent(false);
      }}
      title="Request a session"
      footer={
        !sent && (
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} isLoading={bookMentor.isPending}>
              Send request
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <p className="text-sm text-text-secondary">Your session request has been sent. The mentor will respond soon.</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Controller
            control={control}
            name="sessionType"
            render={({ field }) => (
              <Select
                label="Session type (optional)"
                options={SESSION_TYPE_OPTIONS}
                placeholder="Select a session type"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Textarea
            label="Message"
            rows={4}
            hint="What would you like to discuss?"
            error={errors.message?.message}
            {...register("message")}
          />
          <Input label="Preferred times (optional)" placeholder="e.g. Weekday afternoons, IST" {...register("preferredTimes")} />
        </form>
      )}
    </Dialog>
  );
}

/** What each session format means for the founder booking it. */
const SESSION_TYPE_HINT: Record<string, string> = {
  ONE_ON_ONE: "A private call about your question",
  GROUP: "A session shared with a few founders",
  WORKSHOP: "A hands-on working session on one topic",
  ADVISORY: "Advice over several sessions",
};

const HOW_IT_WORKS = [
  "Send a request with your question and when you're free",
  "They accept, then set the time and share a meeting link",
  "After the call, either of you marks it done and you leave a short review",
];

/**
 * A mentor as founders see them: who they are, what they can help with, how
 * their sessions work, and one clear way to ask for one.
 */
export default function MentorDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: mentor, isLoading, isError } = useMentor(params.id);
  const [requestOpen, setRequestOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-card" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 w-full rounded-card lg:col-span-2" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      </div>
    );
  }
  if (isError) return <ErrorState />;
  if (!mentor) return <p className="text-sm text-text-secondary">Mentor not found.</p>;

  const { averageRating, reviewCount, sessionsCompleted } = mentor.reputation;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={mentor.owner.fullName} src={mentor.owner.avatarUrl} size="lg" />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="heading-5">{mentor.owner.fullName}</h1>
              <VerifiedBadge status={mentor.verificationStatus} />
              {mentor.mentorType && <Badge variant="neutral">{MENTOR_TYPE_LABEL[mentor.mentorType] ?? mentor.mentorType}</Badge>}
            </div>
            {mentor.headline && <p className="body-6 text-text-secondary">{mentor.headline}</p>}
            <p className="flex items-center gap-1.5 caption-2">
              {averageRating != null ? (
                <>
                  <Star className="h-3.5 w-3.5 fill-warning-500 text-warning-500" aria-hidden="true" />
                  <span className="font-semibold text-text-primary">{averageRating.toFixed(1)}</span>
                  <span>
                    from {reviewCount} review{reviewCount === 1 ? "" : "s"}
                  </span>
                </>
              ) : (
                <span>No reviews yet</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <FollowButton userId={mentor.ownerId} />
          {/* On wide screens the booking card beside the profile holds this button. */}
          <Button className="lg:hidden" onClick={() => setRequestOpen(true)}>
            Request a session
          </Button>
        </div>
      </header>

      <StatStrip
        stats={[
          { label: "Experience", value: mentor.yearsExperience != null ? `${mentor.yearsExperience} yrs` : "Not listed" },
          { label: "Sessions completed", value: sessionsCompleted, hint: "Counted when a session is marked done" },
          { label: "Average rating", value: averageRating != null ? averageRating.toFixed(1) : "None yet", hint: `${reviewCount} review${reviewCount === 1 ? "" : "s"} from founders` },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="flex flex-col gap-5">
            <PanelTitle icon={Briefcase} title="Can help with" />
            <div className="flex flex-wrap gap-2">
              {mentor.expertise.map((skill) => (
                <Badge key={skill} variant="brand">
                  {skill}
                </Badge>
              ))}
            </div>
            {mentor.industries.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="caption-4">Industries</p>
                <div className="flex flex-wrap gap-2">
                  {mentor.industries.map((industry) => (
                    <Badge key={industry} variant="neutral">
                      {industry.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {mentor.stagesHelped && mentor.stagesHelped.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="caption-4">Stages they help at</p>
                <div className="flex flex-wrap gap-2">
                  {mentor.stagesHelped.map((stage) => (
                    <Badge key={stage} variant="neutral">
                      {STAGE_LABEL[stage] ?? stage}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {mentor.sessionTypes.length > 0 && (
            <Card className="flex flex-col gap-4">
              <PanelTitle icon={CalendarClock} title="Session formats" />
              <ul className="grid gap-3 sm:grid-cols-2">
                {mentor.sessionTypes.map((type) => (
                  <li key={type} className="flex flex-col gap-0.5 rounded-button border border-border p-3">
                    <span className="body-5 text-text-primary">{SESSION_TYPE_LABEL[type] ?? type}</span>
                    {SESSION_TYPE_HINT[type] && <span className="caption-5">{SESSION_TYPE_HINT[type]}</span>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {mentor.pastStartups.length > 0 && (
            <Card className="flex flex-col gap-4">
              <PanelTitle icon={Rocket} title="Startups they've built or backed" />
              <ul className="flex flex-wrap gap-2">
                {mentor.pastStartups.map((name) => (
                  <li key={name} className="rounded-button bg-background-secondary px-3 py-1.5 body-6 text-text-primary">
                    {name}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
          <Card className="flex flex-col gap-4">
            <h2 className="title-2">Book a session</h2>
            <dl className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
                <div>
                  <dt className="caption-4">Available</dt>
                  <dd className="body-5 text-text-primary">{mentor.availability ?? "Ask in your request"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
                <div>
                  <dt className="caption-4">Fee</dt>
                  <dd className="body-5 text-text-primary">{mentor.pricingModel ?? "Not listed, ask in your request"}</dd>
                </div>
              </div>
              {mentor.meetingMode && (
                <div className="flex items-start gap-3">
                  <MonitorSmartphone className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
                  <div>
                    <dt className="caption-4">Meets</dt>
                    <dd className="body-5 text-text-primary">{MEETING_MODE_LABEL[mentor.meetingMode] ?? mentor.meetingMode}</dd>
                  </div>
                </div>
              )}
              {mentor.languages.length > 0 && (
                <div className="flex items-start gap-3">
                  <Languages className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
                  <div>
                    <dt className="caption-4">Languages</dt>
                    <dd className="body-5 text-text-primary">{mentor.languages.join(", ")}</dd>
                  </div>
                </div>
              )}
            </dl>
            <Button className="w-full" onClick={() => setRequestOpen(true)}>
              Request a session
            </Button>
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <p className="caption-4">How it works</p>
              <ol className="flex flex-col gap-2">
                {HOW_IT_WORKS.map((step) => (
                  <li key={step} className="flex items-start gap-2 caption-5">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-600" aria-hidden="true" />
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        </aside>
      </div>

      <RequestSessionDialog mentorId={mentor.id} open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  );
}
