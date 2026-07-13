"use client";

import type { ConnectionResponseAction, CreateConnectionInput, CreateMessageInput } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { connectionsApi } from "../endpoints/connections";

export const connectionKeys = {
  all: ["connections"] as const,
  quota: ["connections", "quota"] as const,
  messages: (id: string) => ["connections", id, "messages"] as const,
};

export function useConnections() {
  return useQuery({ queryKey: connectionKeys.all, queryFn: connectionsApi.list });
}

export function useConnectionQuota() {
  return useQuery({ queryKey: connectionKeys.quota, queryFn: connectionsApi.quota });
}

export function useSendConnectionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateConnectionInput) => connectionsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectionKeys.all });
      queryClient.invalidateQueries({ queryKey: connectionKeys.quota });
    },
  });
}

export function useRespondToConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: ConnectionResponseAction }) => connectionsApi.respond(id, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: connectionKeys.all }),
  });
}

/** Polls while the thread is open — simplest way to approximate real-time without websocket infra yet. */
export function useConnectionMessages(connectionId: string) {
  return useQuery({
    queryKey: connectionKeys.messages(connectionId),
    queryFn: () => connectionsApi.listMessages(connectionId),
    enabled: !!connectionId,
    refetchInterval: 5000,
  });
}

export function useSendMessage(connectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMessageInput) => connectionsApi.sendMessage(connectionId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: connectionKeys.messages(connectionId) }),
  });
}
