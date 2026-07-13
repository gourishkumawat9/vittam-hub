"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { HiringStatus, TeamMemberCategory, teamStepSchema, type TeamStepInput } from "@vittamhub/types";
import { Input, Select, TagsInput } from "@vittamhub/ui";
import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";

const CATEGORY_OPTIONS = Object.values(TeamMemberCategory).map((value) => ({
  label: value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
  value,
}));
const HIRING_OPTIONS = Object.values(HiringStatus).map((value) => ({
  label: value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
  value,
}));

interface StepProps {
  defaultValues?: Partial<TeamStepInput>;
  onNext: () => void;
  onBack: () => void;
}

export function Step5Team({ defaultValues, onNext, onBack }: StepProps) {
  const setSectionData = useOnboardingStore((s) => s.setSectionData);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<TeamStepInput>({
    resolver: zodResolver(teamStepSchema),
    defaultValues: { members: [], openRoles: [], hiringStatus: HiringStatus.NOT_HIRING, teamSize: 1, ...defaultValues },
  });

  const members = useFieldArray({ control, name: "members" });
  const values = watch();
  const { status } = useAutosave("team", 4, values);

  const onSubmit = handleSubmit((data) => {
    setSectionData("team", data);
    onNext();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-text-primary">Team details</h2>
        <p className="mt-1 text-sm text-text-secondary">Founders, co-founders, employees, advisors, and board members.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">Team members</span>
          <button
            type="button"
            onClick={() => members.append({ category: TeamMemberCategory.FOUNDER, fullName: "", role: "" })}
            className="flex items-center gap-1 text-sm font-medium text-brand-primary"
          >
            <Plus className="h-3.5 w-3.5" /> Add member
          </button>
        </div>
        {members.fields.map((field, index) => (
          <div key={field.id} className="flex flex-col gap-2 rounded-card border border-border p-3">
            <div className="flex items-start gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <Input placeholder="Full name" {...register(`members.${index}.fullName`)} />
                <Input placeholder="Role / title" {...register(`members.${index}.role`)} />
                <Controller
                  control={control}
                  name={`members.${index}.category`}
                  render={({ field: categoryField }) => (
                    <Select options={CATEGORY_OPTIONS} value={categoryField.value} onChange={categoryField.onChange} />
                  )}
                />
                <Input placeholder="LinkedIn URL" {...register(`members.${index}.linkedinUrl`)} />
              </div>
              <button type="button" onClick={() => members.remove(index)} aria-label="Remove member" className="mt-2 text-text-secondary hover:text-danger-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Team size" type="number" error={errors.teamSize?.message} {...register("teamSize")} />
        <Controller
          control={control}
          name="hiringStatus"
          render={({ field }) => <Select label="Hiring status" options={HIRING_OPTIONS} value={field.value} onChange={field.onChange} />}
        />
      </div>

      <Controller
        control={control}
        name="openRoles"
        render={({ field }) => (
          <TagsInput label="Open roles" value={field.value ?? []} onChange={field.onChange} placeholder="e.g. Senior Engineer…" />
        )}
      />

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={status === "saving"} />
    </form>
  );
}
