"use client";

import type { ConnectionListFilters, ConnectionResponseAction, CreateConnectionInput, CreateMessageInput, ScheduleMeetingInput } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { connectionsApi } from "../endpoints/connections";

export const connectionKeys = {
  all: ["connections"] as const,
  list: (filters: ConnectionListFilters) => [...connectionKeys.all, filters] as const,
  quota: ["connections", "quota"] as const,
  messages: (id: string) => ["connections", id, "messages"] as const,
  meetings: (id: string) => ["connections", id, "meetings"] as const,
};

export function useConnections(filters: ConnectionListFilters = { page: 1, pageSize: 20 }) {
  return useQuery({
    queryKey: connectionKeys.list(filters),
    queryFn: () => connectionsApi.list(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useConnectionQuota() {
  return useQuery({ queryKey: connectionKeys.quota, queryFn: connectionsApi.quota });
}

export function useMyMeetings() {
  return useQuery({ queryKey: ["connections", "meetings"], queryFn: connectionsApi.listMyMeetings });
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

export function useRequestMoreInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => connectionsApi.requestInfo(connectionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: connectionKeys.all }),
  });
}

export function useConnectionMeetings(connectionId: string) {
  return useQuery({
    queryKey: connectionKeys.meetings(connectionId),
    queryFn: () => connectionsApi.listMeetings(connectionId),
    enabled: !!connectionId,
  });
}

export function useScheduleMeeting(connectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ScheduleMeetingInput) => connectionsApi.scheduleMeeting(connectionId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: connectionKeys.meetings(connectionId) }),
  });
}
