import { z } from "zod";

import { ApplicationStatus, EmploymentType, JobStatus } from "./enums";

export const jobSchema = z.object({
  id: z.string().uuid(),
  startupId: z.string().uuid(),
  title: z.string().max(160),
  description: z.string().max(5000),
  employmentType: z.nativeEnum(EmploymentType),
  location: z.string().max(120),
  isRemote: z.boolean(),
  skills: z.array(z.string()),
  minSalaryUsd: z.number().nonnegative().nullable(),
  maxSalaryUsd: z.number().nonnegative().nullable(),
  status: z.nativeEnum(JobStatus),
  closedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Job = z.infer<typeof jobSchema>;

export const createJobInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(160),
  description: z.string().min(1, "Description is required").max(5000),
  employmentType: z.nativeEnum(EmploymentType),
  location: z.string().min(1, "Location is required").max(120),
  isRemote: z.boolean().default(false),
  skills: z.array(z.string().max(60)).default([]),
  minSalaryUsd: z.coerce.number().nonnegative().optional(),
  maxSalaryUsd: z.coerce.number().nonnegative().optional(),
});
export type CreateJobInput = z.infer<typeof createJobInputSchema>;

export const updateJobInputSchema = createJobInputSchema.partial();
export type UpdateJobInput = z.infer<typeof updateJobInputSchema>;

export const jobSearchFiltersSchema = z.object({
  query: z.string().max(200).optional(),
  employmentType: z.array(z.nativeEnum(EmploymentType)).optional(),
  location: z.string().optional(),
  isRemote: z.coerce.boolean().optional(),
  skills: z.array(z.string()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type JobSearchFilters = z.infer<typeof jobSearchFiltersSchema>;

export const jobApplicationSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  applicantId: z.string().uuid(),
  resumeUrl: z.string().url(),
  coverLetter: z.string().max(3000).nullable(),
  status: z.nativeEnum(ApplicationStatus),
  createdAt: z.string().datetime(),
});
export type JobApplicationRecord = z.infer<typeof jobApplicationSchema>;

export const applyToJobInputSchema = z.object({
  resumeUrl: z.string().url("A resume link is required"),
  coverLetter: z.string().max(3000).optional(),
});
export type ApplyToJobInput = z.infer<typeof applyToJobInputSchema>;

export const respondToApplicationInputSchema = z.object({
  status: z.enum(["SHORTLISTED", "REJECTED", "HIRED"]),
});
export type RespondToApplicationInput = z.infer<typeof respondToApplicationInputSchema>;
