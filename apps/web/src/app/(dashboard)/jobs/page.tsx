"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useApplyToJob, useJobSearch, type JobWithStartup } from "@vittamhub/api-client";
import { applyToJobInputSchema, type ApplyToJobInput, type JobSearchFilters } from "@vittamhub/types";
import { Badge, Button, Card, Checkbox, Dialog, EmptyState, Input, Textarea } from "@vittamhub/ui";
import { Briefcase } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";

function ApplyDialog({ job, open, onOpenChange }: { job: JobWithStartup; open: boolean; onOpenChange: (open: boolean) => void }) {
  const applyToJob = useApplyToJob();
  const [applied, setApplied] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplyToJobInput>({ resolver: zodResolver(applyToJobInputSchema) });

  const onSubmit = handleSubmit(async (data) => {
    await applyToJob.mutateAsync({ id: job.id, input: data });
    setApplied(true);
    reset();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setApplied(false);
      }}
      title={`Apply to ${job.title}`}
      footer={
        !applied && (
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} isLoading={applyToJob.isPending}>
              Submit application
            </Button>
          </>
        )
      }
    >
      {applied ? (
        <p className="text-sm text-text-secondary">Your application has been submitted.</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input label="Resume link" placeholder="https://…" error={errors.resumeUrl?.message} {...register("resumeUrl")} />
          <Textarea label="Cover letter (optional)" rows={4} {...register("coverLetter")} />
        </form>
      )}
    </Dialog>
  );
}

export default function JobsBrowsePage() {
  const [filters, setFilters] = useState<JobSearchFilters>({ page: 1, pageSize: 20 });
  const { data, isLoading } = useJobSearch(filters);
  const items = data?.items ?? [];
  const [applyingTo, setApplyingTo] = useState<JobWithStartup | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Jobs</h1>
        <p className="text-sm text-text-secondary">Open roles across startups on VittamHub.</p>
      </div>

      <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
        <Input
          placeholder="Search by title or description…"
          value={filters.query ?? ""}
          onChange={(e) => setFilters({ ...filters, query: e.target.value || undefined, page: 1 })}
        />
        <Checkbox
          checked={filters.isRemote ?? false}
          onCheckedChange={(isRemote) => setFilters({ ...filters, isRemote, page: 1 })}
          label="Remote only"
        />
      </div>

      {isLoading ? (
        <CardGridSkeleton />
      ) : items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((job) => (
            <Card key={job.id} className="flex flex-col gap-4">
              <div>
                <h3 className="font-heading text-sm font-semibold text-text-primary">{job.title}</h3>
                <p className="text-xs text-text-secondary">
                  {job.startup.name} · {job.location} {job.isRemote && "· Remote"}
                </p>
              </div>
              <p className="line-clamp-3 text-sm text-text-secondary">{job.description}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="brand">{job.employmentType.replace(/_/g, " ")}</Badge>
                {job.skills.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="neutral">
                    {skill}
                  </Badge>
                ))}
              </div>
              <Button size="sm" className="mt-auto" onClick={() => setApplyingTo(job)}>
                Apply
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Briefcase} title="No open roles yet" description="Check back soon as startups post jobs." />
      )}

      {applyingTo && <ApplyDialog job={applyingTo} open={!!applyingTo} onOpenChange={(open) => !open && setApplyingTo(null)} />}
    </div>
  );
}
