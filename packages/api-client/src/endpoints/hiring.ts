import type {
  ApplyToJobInput,
  CreateJobInput,
  Job,
  JobApplicationRecord,
  JobSearchFilters,
  PaginatedResult,
  RespondToApplicationInput,
  UpdateJobInput,
} from "@vittamhub/types";

import { apiRequest } from "../http";

/** `GET /v1/jobs` and `/v1/jobs/applications/mine` join in the posting startup so cards never need a follow-up fetch. */
export interface JobWithStartup extends Job {
  startup: { id: string; name: string; slug: string; logoUrl: string | null };
}

export interface JobApplicationWithJob extends JobApplicationRecord {
  job: JobWithStartup;
}

export interface JobApplicationWithApplicant extends JobApplicationRecord {
  applicant: { id: string; fullName: string; avatarUrl: string | null };
}

export const hiringApi = {
  search: (filters: JobSearchFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
      else params.set(key, String(value));
    });
    return apiRequest<PaginatedResult<JobWithStartup>>(`/v1/jobs?${params.toString()}`);
  },
  listMine: () => apiRequest<Job[]>("/v1/jobs/mine"),
  create: (input: CreateJobInput) => apiRequest<Job>("/v1/jobs", { method: "POST", body: input }),
  update: (id: string, input: UpdateJobInput) => apiRequest<Job>(`/v1/jobs/${id}`, { method: "PATCH", body: input }),
  close: (id: string) => apiRequest<Job>(`/v1/jobs/${id}/close`, { method: "POST" }),
  apply: (id: string, input: ApplyToJobInput) =>
    apiRequest<JobApplicationRecord>(`/v1/jobs/${id}/apply`, { method: "POST", body: input }),
  listApplications: (id: string) => apiRequest<JobApplicationWithApplicant[]>(`/v1/jobs/${id}/applications`),
  listMyApplications: () => apiRequest<JobApplicationWithJob[]>("/v1/jobs/applications/mine"),
  respondToApplication: (id: string, input: RespondToApplicationInput) =>
    apiRequest<JobApplicationRecord>(`/v1/jobs/applications/${id}`, { method: "PATCH", body: input }),
};
