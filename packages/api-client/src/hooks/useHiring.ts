"use client";

import type { ApplyToJobInput, CreateJobInput, JobSearchFilters, RespondToApplicationInput, UpdateJobInput } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { hiringApi } from "../endpoints/hiring";

const hiringKeys = {
  all: ["jobs"] as const,
  search: (filters: JobSearchFilters) => [...hiringKeys.all, "search", filters] as const,
  mine: ["jobs", "mine"] as const,
  applications: (jobId: string) => ["jobs", jobId, "applications"] as const,
  myApplications: ["jobs", "applications", "mine"] as const,
};

export function useJobSearch(filters: JobSearchFilters) {
  return useQuery({ queryKey: hiringKeys.search(filters), queryFn: () => hiringApi.search(filters) });
}

export function useMyJobs() {
  return useQuery({ queryKey: hiringKeys.mine, queryFn: hiringApi.listMine });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateJobInput) => hiringApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: hiringKeys.mine }),
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateJobInput }) => hiringApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: hiringKeys.mine }),
  });
}

export function useCloseJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hiringApi.close(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: hiringKeys.mine }),
  });
}

export function useApplyToJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ApplyToJobInput }) => hiringApi.apply(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: hiringKeys.myApplications }),
  });
}

export function useJobApplications(jobId: string) {
  return useQuery({ queryKey: hiringKeys.applications(jobId), queryFn: () => hiringApi.listApplications(jobId), enabled: !!jobId });
}

export function useMyJobApplications() {
  return useQuery({ queryKey: hiringKeys.myApplications, queryFn: hiringApi.listMyApplications });
}

export function useRespondToApplication(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RespondToApplicationInput }) => hiringApi.respondToApplication(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: hiringKeys.applications(jobId) }),
  });
}
