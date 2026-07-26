"use client";

import type { CreateMandateInput, UpdateMandateInput } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { mandatesApi } from "../endpoints/mandates";

const mandateKeys = {
  all: ["mandates"] as const,
  matches: (id: string) => ["mandates", id, "matches"] as const,
};

/** A named, reusable investment thesis — an investor runs several at once, each producing its own match stream. */
export function useMandates() {
  return useQuery({ queryKey: mandateKeys.all, queryFn: mandatesApi.list });
}

export function useCreateMandate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMandateInput) => mandatesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mandateKeys.all }),
  });
}

export function useUpdateMandate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMandateInput }) => mandatesApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mandateKeys.all }),
  });
}

export function useRemoveMandate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mandatesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mandateKeys.all }),
  });
}

export function useMandateMatches(id: string, limit?: number) {
  return useQuery({ queryKey: mandateKeys.matches(id), queryFn: () => mandatesApi.matches(id, limit), enabled: !!id });
}
