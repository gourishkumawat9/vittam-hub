import { z } from "zod";

import { AvailabilityType } from "./enums";

export const workExperienceEntrySchema = z.object({
  company: z.string().min(1, "Company is required").max(160),
  title: z.string().min(1, "Title is required").max(160),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().max(1000).optional(),
});
export type WorkExperienceEntryInput = z.infer<typeof workExperienceEntrySchema>;

export const educationEntrySchema = z.object({
  institution: z.string().min(1, "Institution is required").max(160),
  degree: z.string().max(120).optional(),
  fieldOfStudy: z.string().max(120).optional(),
  startYear: z.coerce.number().int().min(1950).max(2100).optional(),
  endYear: z.coerce.number().int().min(1950).max(2100).optional(),
});
export type EducationEntryInput = z.infer<typeof educationEntrySchema>;

export const jobSeekerProfileSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  headline: z.string().max(160).nullable(),
  resumeUrl: z.string().url().nullable(),
  skills: z.array(z.string()),
  preferredRoles: z.array(z.string()),
  expectedSalaryMinUsd: z.number().nonnegative().nullable(),
  expectedSalaryMaxUsd: z.number().nonnegative().nullable(),
  availability: z.nativeEnum(AvailabilityType),
  isPublic: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type JobSeekerProfileRecord = z.infer<typeof jobSeekerProfileSchema>;

export const createJobSeekerInputSchema = z.object({
  headline: z.string().min(1, "Add a short headline").max(160),
  resumeUrl: z.string().url().optional(),
  skills: z.array(z.string().max(60)).min(1, "Add at least one skill"),
  experience: z.array(workExperienceEntrySchema).default([]),
  education: z.array(educationEntrySchema).default([]),
  preferredRoles: z.array(z.string().max(80)).min(1, "Add at least one preferred role"),
  expectedSalaryMinUsd: z.coerce.number().nonnegative().optional(),
  expectedSalaryMaxUsd: z.coerce.number().nonnegative().optional(),
  availability: z.nativeEnum(AvailabilityType),
});
export type CreateJobSeekerInput = z.infer<typeof createJobSeekerInputSchema>;
