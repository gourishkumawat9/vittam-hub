"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useBookMentor, useMentor } from "@vittamhub/api-client";
import { createMentorBookingInputSchema, SessionType, type CreateMentorBookingInput } from "@vittamhub/types";
import { Badge, Button, Card, Dialog, Select, Textarea, Input } from "@vittamhub/ui";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { FollowButton } from "@/components/dashboard/FollowButton";

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

export default function MentorDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: mentor, isLoading } = useMentor(params.id);
  const [requestOpen, setRequestOpen] = useState(false);

  if (isLoading) return <p className="text-sm text-text-secondary">Loading…</p>;
  if (!mentor) return <p className="text-sm text-text-secondary">Mentor not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">{mentor.owner.fullName}</h1>
          <p className="text-sm text-text-secondary">{mentor.headline}</p>
        </div>
        <div className="flex items-center gap-2">
          <FollowButton userId={mentor.ownerId} />
          <Button onClick={() => setRequestOpen(true)}>Request a session</Button>
        </div>
      </div>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          {mentor.expertise.map((skill) => (
            <Badge key={skill} variant="brand">
              {skill}
            </Badge>
          ))}
        </div>
        <div className="grid gap-4 text-sm text-text-secondary sm:grid-cols-2">
          <p>Industries: {mentor.industries.join(", ") || "—"}</p>
          <p>Experience: {mentor.yearsExperience != null ? `${mentor.yearsExperience} years` : "—"}</p>
          <p>Availability: {mentor.availability ?? "—"}</p>
          <p>Pricing: {mentor.pricingModel ?? "—"}</p>
        </div>
      </Card>

      <RequestSessionDialog mentorId={mentor.id} open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  );
}
