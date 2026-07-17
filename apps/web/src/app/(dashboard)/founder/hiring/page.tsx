"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCloseJob,
  useCreateJob,
  useJobApplications,
  useMyJobs,
  useRespondToApplication,
} from "@vittamhub/api-client";
import {
  createJobInputSchema,
  EmploymentType,
  type ApplicationStatus,
  type CreateJobInput,
  type Job,
} from "@vittamhub/types";
import { Badge, Button, Card, Dialog, EmptyState, Input, Select, TagsInput, Textarea } from "@vittamhub/ui";
import { Briefcase } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";

const EMPLOYMENT_TYPE_OPTIONS = Object.values(EmploymentType).map((type) => ({
  label: type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
  value: type,
}));

const STATUS_BADGE_VARIANT: Record<string, "success" | "warning" | "neutral" | "danger" | "info"> = {
  OPEN: "success",
  CLOSED: "neutral",
  SUBMITTED: "warning",
  SHORTLISTED: "info",
  REJECTED: "danger",
  HIRED: "success",
};

function PostJobDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createJob = useCreateJob();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateJobInput>({
    resolver: zodResolver(createJobInputSchema),
    defaultValues: { isRemote: false, skills: [] },
  });

  const onSubmit = handleSubmit(async (data) => {
    await createJob.mutateAsync(data);
    reset();
    onOpenChange(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Post a job"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={createJob.isPending}>
            Post job
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label="Title" error={errors.title?.message} {...register("title")} />
        <Textarea label="Description" rows={4} error={errors.description?.message} {...register("description")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="employmentType"
            render={({ field }) => (
              <Select
                label="Employment type"
                options={EMPLOYMENT_TYPE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.employmentType?.message}
              />
            )}
          />
          <Input label="Location" error={errors.location?.message} {...register("location")} />
        </div>
        <Controller
          control={control}
          name="skills"
          render={({ field }) => (
            <TagsInput label="Skills" value={field.value ?? []} onChange={field.onChange} placeholder="e.g. React, Node…" />
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Min salary (USD, optional)" type="number" {...register("minSalaryUsd")} />
          <Input label="Max salary (USD, optional)" type="number" {...register("maxSalaryUsd")} />
        </div>
      </form>
    </Dialog>
  );
}

function ApplicantsList({ job }: { job: Job }) {
  const { data: applications, isLoading } = useJobApplications(job.id);
  const respond = useRespondToApplication(job.id);

  if (isLoading) return <p className="text-sm text-text-secondary">Loading applicants…</p>;
  if (!applications || applications.length === 0) return <p className="text-sm text-text-secondary">No applicants yet.</p>;

  const act = (id: string, status: ApplicationStatus) => respond.mutate({ id, input: { status: status as "SHORTLISTED" | "REJECTED" | "HIRED" } });

  return (
    <div className="flex flex-col divide-y divide-border">
      {applications.map((application) => (
        <div key={application.id} className="flex items-center justify-between gap-4 py-3">
          <div>
            <p className="text-sm font-medium text-text-primary">{application.applicant.fullName}</p>
            <a href={application.resumeUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-primary hover:underline">
              View resume
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_BADGE_VARIANT[application.status] ?? "neutral"}>{application.status}</Badge>
            <Button size="sm" variant="ghost" onClick={() => act(application.id, "SHORTLISTED")}>
              Shortlist
            </Button>
            <Button size="sm" variant="secondary" onClick={() => act(application.id, "REJECTED")}>
              Reject
            </Button>
            <Button size="sm" onClick={() => act(application.id, "HIRED")}>
              Hire
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const closeJob = useCloseJob();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-sm font-semibold text-text-primary">{job.title}</h3>
          <p className="text-xs text-text-secondary">
            {job.location} · {job.employmentType.replace(/_/g, " ")} {job.isRemote && "· Remote"}
          </p>
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[job.status] ?? "neutral"}>{job.status}</Badge>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {job.skills.map((skill) => (
          <Badge key={skill} variant="brand">
            {skill}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-xs font-medium text-brand-primary hover:underline">
          {expanded ? "Hide applicants" : "View applicants"}
        </button>
        {job.status === "OPEN" && (
          <Button size="sm" variant="secondary" isLoading={closeJob.isPending} onClick={() => closeJob.mutate(job.id)}>
            Close posting
          </Button>
        )}
      </div>

      {expanded && <ApplicantsList job={job} />}
    </Card>
  );
}

export default function FounderHiringPage() {
  const { data: jobs, isLoading } = useMyJobs();
  const [postOpen, setPostOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">Hiring</h1>
          <p className="text-sm text-text-secondary">Post roles and manage applicants for your startup.</p>
        </div>
        <Button onClick={() => setPostOpen(true)}>Post a job</Button>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={2} />
      ) : jobs && jobs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Briefcase} title="No job postings yet" description="Post your first role to start receiving applications." />
      )}

      <PostJobDialog open={postOpen} onOpenChange={setPostOpen} />
    </div>
  );
}
