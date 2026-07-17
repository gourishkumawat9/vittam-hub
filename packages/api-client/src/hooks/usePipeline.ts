"use client";

import type { AddToPipelineInput, UpdatePipelineEntryInput } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { pipelineApi } from "../endpoints/pipeline";

const pipelineKeys = { all: ["pipeline"] as const };

export function usePipeline() {
  return useQuery({ queryKey: pipelineKeys.all, queryFn: pipelineApi.list });
}

export function useAddToPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddToPipelineInput) => pipelineApi.add(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pipelineKeys.all }),
  });
}

export function useUpdatePipelineEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePipelineEntryInput }) => pipelineApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pipelineKeys.all }),
  });
}

export function useRemovePipelineEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pipelineApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pipelineKeys.all }),
  });
}
