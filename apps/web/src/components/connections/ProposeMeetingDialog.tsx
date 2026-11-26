"use client";

import { useScheduleMeeting } from "@vittamhub/api-client";
import { Button, Dialog, Input, Textarea } from "@vittamhub/ui";
import { useForm } from "react-hook-form";

import { localInputToIso, nowForLocalInput } from "@/lib/datetime";

interface MeetingFormValues {
  scheduledAt: string;
  notes?: string;
  videoCallUrl?: string;
}

/**
 * Propose a meeting on an accepted connection. The time is picked in the
 * proposer's own time zone and shows in each person's own.
 */
export function ProposeMeetingDialog({
  connectionId,
  withName,
  open,
  onOpenChange,
}: {
  connectionId: string;
  withName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const scheduleMeeting = useScheduleMeeting(connectionId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MeetingFormValues>();

  const onSubmit = handleSubmit(async (data) => {
    // The picker's value has no time zone. Sent as it was, the API read it as
    // UTC, so a 3 pm meeting proposed from India was stored as 8:30 pm.
    await scheduleMeeting.mutateAsync({ ...data, scheduledAt: localInputToIso(data.scheduledAt) ?? data.scheduledAt });
    reset();
    onOpenChange(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Propose a meeting"
      description={withName ? `${withName} sees it in this conversation, in their own time zone.` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={scheduleMeeting.isPending}>
            Propose
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Date and time"
          type="datetime-local"
          min={nowForLocalInput()}
          error={errors.scheduledAt && "Pick a date and time"}
          {...register("scheduledAt", { required: true })}
        />
        <Input label="Video call link (optional)" placeholder="https://…" {...register("videoCallUrl")} />
        <Textarea label="What you'd like to cover (optional)" rows={2} {...register("notes")} />
      </form>
    </Dialog>
  );
}
