"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePublishOnboarding, uploadFile } from "@vittamhub/api-client";
import { AvailabilityType, createJobSeekerInputSchema, type CreateJobSeekerInput } from "@vittamhub/types";
import { Input, Select, TagsInput } from "@vittamhub/ui";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { useAutosave } from "@/hooks/useAutosave";
import { useOnboardingStore } from "@/store/onboarding-store";

import { WizardNav } from "../WizardNav";

const AVAILABILITY_OPTIONS = Object.values(AvailabilityType).map((value) => ({
  label: value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
  value,
}));

interface JobSeekerInfoStepProps {
  defaultValues?: Partial<CreateJobSeekerInput>;
  onBack: () => void;
}

export function JobSeekerInfoStep({ defaultValues, onBack }: JobSeekerInfoStepProps) {
  const router = useRouter();
  const { setSectionData, reset } = useOnboardingStore();
  const publish = usePublishOnboarding();
  const [publishError, setPublishError] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateJobSeekerInput>({
    resolver: zodResolver(createJobSeekerInputSchema),
    defaultValues: { skills: [], experience: [], education: [], preferredRoles: [], ...defaultValues },
  });

  const experience = useFieldArray({ control, name: "experience" });
  const education = useFieldArray({ control, name: "education" });
  const values = watch();
  const { status } = useAutosave("jobSeekerInfo", 1, values);

  const handleResumeUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadingResume(true);
    try {
      const url = await uploadFile(file, "resumes");
      setValue("resumeUrl", url);
    } finally {
      setUploadingResume(false);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    setSectionData("jobSeekerInfo", data);
    setPublishError(null);
    try {
      await publish.mutateAsync({});
      reset();
      router.push("/?published=true");
    } catch {
      setPublishError("We couldn't publish your profile. Please check your details and try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-text-primary">Job seeker profile</h2>
        <p className="mt-1 text-sm text-text-secondary">Show startups why you&apos;re the right hire.</p>
      </div>

      <Input label="Headline" hint='e.g. "Full-stack engineer, ex-Razorpay"' error={errors.headline?.message} {...register("headline")} />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-primary">Resume</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => handleResumeUpload(e.target.files?.[0])}
          className="text-sm text-text-secondary file:mr-3 file:rounded-button file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
        />
        {uploadingResume && <p className="text-xs text-text-secondary">Uploading…</p>}
        {values.resumeUrl && !uploadingResume && <p className="truncate text-xs text-success-600">Resume uploaded</p>}
      </div>

      <Controller
        control={control}
        name="skills"
        render={({ field }) => <TagsInput label="Skills" value={field.value ?? []} onChange={field.onChange} error={errors.skills?.message} />}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">Work experience</span>
          <button type="button" onClick={() => experience.append({ company: "", title: "" })} className="flex items-center gap-1 text-sm font-medium text-brand-primary">
            <Plus className="h-3.5 w-3.5" /> Add role
          </button>
        </div>
        {experience.fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2 rounded-card border border-border p-3">
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <Input placeholder="Company" {...register(`experience.${index}.company`)} />
              <Input placeholder="Title" {...register(`experience.${index}.title`)} />
              <Input placeholder="Start date" type="date" {...register(`experience.${index}.startDate`)} />
              <Input placeholder="End date" type="date" {...register(`experience.${index}.endDate`)} />
            </div>
            <button type="button" onClick={() => experience.remove(index)} aria-label="Remove role" className="mt-2 text-text-secondary hover:text-danger-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">Education</span>
          <button type="button" onClick={() => education.append({ institution: "" })} className="flex items-center gap-1 text-sm font-medium text-brand-primary">
            <Plus className="h-3.5 w-3.5" /> Add education
          </button>
        </div>
        {education.fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2 rounded-card border border-border p-3">
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <Input placeholder="Institution" {...register(`education.${index}.institution`)} />
              <Input placeholder="Degree" {...register(`education.${index}.degree`)} />
              <Input placeholder="Field of study" {...register(`education.${index}.fieldOfStudy`)} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Start year" type="number" {...register(`education.${index}.startYear`)} />
                <Input placeholder="End year" type="number" {...register(`education.${index}.endYear`)} />
              </div>
            </div>
            <button type="button" onClick={() => education.remove(index)} aria-label="Remove education" className="mt-2 text-text-secondary hover:text-danger-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <Controller
        control={control}
        name="preferredRoles"
        render={({ field }) => (
          <TagsInput label="Preferred roles" value={field.value ?? []} onChange={field.onChange} error={errors.preferredRoles?.message} />
        )}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Expected salary min (USD)" type="number" {...register("expectedSalaryMinUsd")} />
        <Input label="Expected salary max (USD)" type="number" {...register("expectedSalaryMaxUsd")} />
        <Controller
          control={control}
          name="availability"
          render={({ field }) => (
            <Select label="Availability" options={AVAILABILITY_OPTIONS} value={field.value} onChange={field.onChange} error={errors.availability?.message} />
          )}
        />
      </div>

      {publishError && <p className="text-sm text-danger-600">{publishError}</p>}

      <WizardNav onBack={onBack} onNext={onSubmit} isSubmitting={status === "saving" || publish.isPending} nextLabel="Complete profile" />
    </form>
  );
}
