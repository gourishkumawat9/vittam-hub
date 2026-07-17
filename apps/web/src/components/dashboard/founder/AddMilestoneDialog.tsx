"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAddMilestone } from "@vittamhub/api-client";
import { createMilestoneInputSchema, MilestoneType, type CreateMilestoneInput } from "@vittamhub/types";
import { Button, Checkbox, Dialog, Input, Select, Textarea } from "@vittamhub/ui";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { EvidenceUpload } from "./EvidenceUpload";

const MILESTONE_LABEL: Record<string, string> = {
  IDEA_CREATED: "Idea created",
  PROTOTYPE: "Prototype",
  MVP: "MVP",
  FIRST_CUSTOMER: "First customer",
  REVENUE: "Revenue",
  SEED_ROUND: "Seed round",
  AWARD: "Award",
  HIRING: "Hiring",
  PRODUCT_LAUNCH: "Product launch",
  OTHER: "Other",
};
const MILESTONE_OPTIONS = Object.values(MilestoneType).map((value) => ({ label: MILESTONE_LABEL[value] ?? value, value }));

interface AddMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMilestoneDialog({ open, onOpenChange }: AddMilestoneDialogProps) {
  const addMilestone = useAddMilestone();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateMilestoneInput>({
    resolver: zodResolver(createMilestoneInputSchema),
    defaultValues: { type: MilestoneType.MVP, evidenceUrls: [], shareToCommunity: false },
  });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      await addMilestone.mutateAsync(data);
      reset();
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Couldn't add that milestone.");
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add a milestone"
      description="Shows up on your public timeline in chronological order."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={addMilestone.isPending}>
            Add milestone
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Controller
          control={control}
          name="type"
          render={({ field }) => <Select label="Type" options={MILESTONE_OPTIONS} value={field.value} onChange={field.onChange} />}
        />
        <Input label="Title" error={errors.title?.message} {...register("title")} />
        <Input label="Date" type="date" error={errors.achievedAt?.message} {...register("achievedAt")} />
        <Textarea label="Description (optional)" rows={3} {...register("description")} />
        <Controller
          control={control}
          name="evidenceUrls"
          render={({ field }) => <EvidenceUpload value={field.value ?? []} onChange={field.onChange} />}
        />
        <Controller
          control={control}
          name="shareToCommunity"
          render={({ field }) => (
            <Checkbox
              checked={field.value ?? false}
              onCheckedChange={field.onChange}
              label="Also share this as an update on the Community feed"
            />
          )}
        />
        {submitError && <p className="text-sm text-danger-600">{submitError}</p>}
      </form>
    </Dialog>
  );
}
